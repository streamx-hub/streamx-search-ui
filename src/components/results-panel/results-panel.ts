import {
  onUrlChange,
  fetchSearchResults,
  html,
  normalizeLabels,
} from "../../helper";
import { DEFAULT_QUERY_PARAM } from "../../config";
import {
  buildSearchRequestBody,
  joinFacetPath,
  DEFAULT_FACET_FIELD_PREFIX,
  DEFAULT_FACET_FILTER_FIELD,
  DEFAULT_FACET_PATH_SEPARATOR,
  DEFAULT_FACET_FIELD_SIZE,
} from "../../search-request";
import type {
  OpenSearchAggregation,
  OpenSearchAggregationBucket,
  OpenSearchResponse,
  SearchRequestMethod,
  SearchRequestOptions,
} from "../../types/open-search";
import createPagination from "./pagination";
import {
  renderDefaultLoader,
  renderNoItem,
  renderResultsLoadingOverlay,
  renderResultsPanelError,
} from "./renderers";
import "./results-panel.css";

type CustomRenderer = (...args: unknown[]) => HTMLElement;

export type ResultsPanelRenderers = {
  [rendererName: string]: CustomRenderer;
};

export type ResultsPanelLabelsConfig = {
  paginationInfo?: (currentPage: number, pageNumber: number) => string;
  totalResults?: (totalCount: number) => string;
  ariaPaginationGoToPage?: (pageNumber: number) => string;
  ariaPaginationNavigation?: string;
};

export type ResultsPanelLabels = Required<ResultsPanelLabelsConfig>;

/**
 * Labels after normalization: a label given as a plain string becomes a getter,
 * while a label given as a function keeps its own signature.
 */
type ResultsPanelNormalizedLabels = {
  [K in keyof ResultsPanelLabels]: NonNullable<ResultsPanelLabels[K]> extends (
    ...args: infer A
  ) => string
    ? (...args: A) => string
    : () => string;
};

export interface ResultsConfig {
  pageSize?: number;
  dataSources: string[];
  renderers?: ResultsPanelRenderers;
  labels?: ResultsPanelLabelsConfig;
  /**
   * Transport used to fetch results. `POST` is required for facets and
   * filtering, since those travel in the request body.
   */
  method?: SearchRequestMethod;
  /** URL param carrying the active query. Must match the query input's. */
  queryParam?: string;
  /** How deep the facet aggregations nest. Defaults to a single flat level. */
  facetDepthLevel?: number;
  /** Saved query/template id sent as the request body `id`. */
  requestId?: string;
  /** Field the selected facet values are filtered against. */
  facetFilterField?: string;
  /** Field name prefix for the facet levels; the level index is appended. */
  facetFieldPrefix?: string;
  /** Separator used to build hierarchical facet paths. */
  facetPathSeparator?: string;
  /** Max buckets requested per facet level. */
  facetFieldSize?: number;
}

export type Results = Omit<Required<ResultsConfig>, "labels" | "requestId"> & {
  requestId?: string;
  labels: ResultsPanelNormalizedLabels;
};

/** Per-panel mutable state, kept off the element itself. */
interface PanelState {
  currentPage: number;
  /**
   * Selected facet values, keyed by the facet **tree** (the top-level
   * aggregation field) they were selected under, so every selection inside one
   * tree ends up OR-ed in a single filter entry.
   */
  selectedFilters: Map<string, Set<string>>;
  facetsElement: HTMLElement | null;
  resultsContainer: HTMLElement | null;
  /** In-flight results request, aborted when a newer one supersedes it. */
  request: AbortController | null;
}

const panelStates = new WeakMap<HTMLElement, PanelState>();

const defaultConfig = {
  pageSize: 20,
  method: "GET" as SearchRequestMethod,
  queryParam: DEFAULT_QUERY_PARAM,
  facetDepthLevel: 1,
  facetFilterField: DEFAULT_FACET_FILTER_FIELD,
  facetFieldPrefix: DEFAULT_FACET_FIELD_PREFIX,
  facetPathSeparator: DEFAULT_FACET_PATH_SEPARATOR,
  facetFieldSize: DEFAULT_FACET_FIELD_SIZE,
  renderers: {
    loader: renderDefaultLoader,
    error: renderResultsPanelError,
  },
  labels: {
    paginationInfo: (currentPage: number, pageNumber: number) =>
      `Page ${currentPage} of ${pageNumber}`,
    totalResults: (totalCount: number) => `${totalCount} results found.`,
    ariaPaginationGoToPage: (pageNumber: number) => `Go to page ${pageNumber}`,
    ariaPaginationNavigation: () => "Pagination",
  },
};

const resolveConfig = (resultsConfig: Results | ResultsConfig): Results => {
  const defaultLabels = normalizeLabels(defaultConfig.labels);
  const configLabels = resultsConfig.labels
    ? normalizeLabels(resultsConfig.labels)
    : {};
  // Spreading an explicitly-undefined override would drop the default — e.g.
  // `queryParam: undefined` would make the panel read a param named "undefined".
  const overrides = Object.fromEntries(
    Object.entries(resultsConfig).filter(([, value]) => value !== undefined),
  ) as Partial<ResultsConfig>;

  return {
    ...defaultConfig,
    ...overrides,
    dataSources: resultsConfig.dataSources,
    renderers: {
      ...defaultConfig.renderers,
      ...resultsConfig.renderers,
    },
    labels: {
      ...defaultLabels,
      ...Object.fromEntries(
        Object.entries(configLabels).filter(([, value]) => value !== undefined),
      ),
    },
  };
};

const getLiveRegion = () => {
  const liveRegionEl = document.querySelector(
    ".stx-results-panel__live-region",
  );

  if (liveRegionEl) {
    return liveRegionEl;
  }

  const resultsPanelLiveRegion = html`<div
    class="stx-results-panel__live-region stx-sr-only"
    aria-live="polite"
    aria-atomic="true"
    role="status"
  ></div>` as HTMLDivElement;

  document.body.append(resultsPanelLiveRegion);

  return resultsPanelLiveRegion;
};

const announceResults = (message: string) => {
  const statusEl = getLiveRegion();
  statusEl.textContent = "";

  requestAnimationFrame(() => {
    statusEl.textContent = message;
  });
};

const restoreFocusForPage = () => {
  let activePage: string | null = null;

  if (
    document.activeElement &&
    document.activeElement.getAttribute("data-page-number")
  ) {
    activePage = document.activeElement.getAttribute("data-page-number");
  }

  return () => {
    if (activePage) {
      const btn = document.querySelector(`[data-page-number="${activePage}"`);

      if (btn instanceof HTMLButtonElement) {
        btn.focus();
      }
    }
  };
};

const showResultsLoading = (resultsContainer: HTMLElement) => {
  resultsContainer.classList.add("stx-results-panel__container--loading");
  resultsContainer.setAttribute("aria-busy", "true");

  if (!resultsContainer.querySelector(".stx-results-panel__loading-overlay")) {
    resultsContainer.append(renderResultsLoadingOverlay());
  }
};

const hideResultsLoading = (resultsContainer: HTMLElement) => {
  resultsContainer.classList.remove("stx-results-panel__container--loading");
  resultsContainer.removeAttribute("aria-busy");
  resultsContainer
    .querySelector(".stx-results-panel__loading-overlay")
    ?.remove();
};

const getSearchQuery = (queryParam: string) =>
  new URL(window.location.href).searchParams.get(queryParam) || "";

const buildSearchUrl = (results: Results, pageNumber: number) => {
  const dataUrl = new URL(results.dataSources[0], window.location.href);

  dataUrl.searchParams.set("from", String((pageNumber - 1) * results.pageSize));
  dataUrl.searchParams.set("size", String(results.pageSize));

  return dataUrl.toString();
};

const serializeFilters = (selectedFilters: Map<string, Set<string>>) =>
  Object.fromEntries(
    [...selectedFilters.entries()].map(([field, values]) => [
      field,
      [...values],
    ]),
  );

const buildResultsRequestOptions = (
  results: Results,
  pageNumber: number,
  selectedFilters: Map<string, Set<string>>,
  query: string,
): SearchRequestOptions => {
  if (results.method !== "POST") {
    return {};
  }

  return {
    method: "POST",
    body: buildSearchRequestBody({
      requestId: results.requestId,
      from: (pageNumber - 1) * results.pageSize,
      size: results.pageSize,
      query,
      filters: serializeFilters(selectedFilters),
      filterField: results.facetFilterField,
      facetDepthLevel: results.facetDepthLevel,
      facetFieldPrefix: results.facetFieldPrefix,
      facetFieldSize: results.facetFieldSize,
    }),
  };
};

const createResultsNumber = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const totalNumber = data.hits?.total.value || 0;
  const pageSize = results.pageSize;
  const pagesNumber = Math.ceil(totalNumber / pageSize);

  return html`
    <div class="stx-results-panel__results-number">
      <span class="stx-results-panel__page-number">
        ${results.labels.paginationInfo(currentPage, pagesNumber)}
      </span>
      <span class="stx-results-panel__total-number">
        ${results.labels.totalResults(totalNumber)}
      </span>
    </div>
  ` as HTMLDivElement;
};

const createItems = (
  data: OpenSearchResponse,
  renderers: ResultsPanelRenderers,
) => {
  return data.hits.hits?.map((item) => {
    const { type } = item._source;
    let itemContent: HTMLElement | string;

    if (renderers[`item-${type}`]) {
      try {
        itemContent = renderers[`item-${type}`](item);
      } catch (error) {
        console.error(error);
        return renderNoItem(item);
      }
    } else {
      itemContent = html`
        <span class="stx-results-panel__missing-renderer">
          <span>Missing renderer for "item-${item?._source?.type}"</span>
          <span>${JSON.stringify(item)}</span>
        </span>
      ` as HTMLSpanElement;
    }

    return html`
      <li class="stx-results-panel__results-item">${itemContent}</li>
    ` as HTMLDivElement;
  });
};

/* ------------------------------------------------------------------ facets */

let facetNodeIdSeq = 0;

interface FacetChildAggregation {
  field: string;
  buckets: OpenSearchAggregationBucket[];
}

interface FacetRenderContext {
  panelState: PanelState;
  pathSeparator: string;
  /**
   * Top-level aggregation field the whole tree belongs to. Every node in the
   * tree records its selection under this key, regardless of its depth.
   */
  treeField: string;
}

const FACET_NODE_SELECTOR = ".stx-results-panel__facet-node";
const FACET_CHILDREN_SELECTOR = ".stx-results-panel__facet-children";
const FACET_OWN_INPUT_SELECTOR =
  ":scope > .stx-results-panel__facet-row .stx-results-panel__facet-option input";

/** Turns an aggregation field name into a heading, e.g. `category_level0` → `Category`. */
const humanizeFacetName = (field: string) =>
  field
    .replace(/_level\d+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || field;

/**
 * Finds a bucket's nested sub-aggregation, i.e. the property that is not one of
 * the bucket's own fields and carries its own `buckets` array.
 */
const getBucketChildAgg = (
  bucket: OpenSearchAggregationBucket,
): FacetChildAggregation | null => {
  for (const key of Object.keys(bucket)) {
    if (key === "key" || key === "key_as_string" || key === "doc_count") {
      continue;
    }

    const value = bucket[key] as OpenSearchAggregation | undefined;

    if (value && Array.isArray(value.buckets)) {
      return { field: key, buckets: value.buckets };
    }
  }

  return null;
};

const createFacetNodeList = (
  buckets: OpenSearchAggregationBucket[],
  context: FacetRenderContext,
  parentPath = "",
): HTMLElement[] => {
  // Only reserve chevron space when at least one sibling actually nests, so a
  // fully flat facet renders as a clean checkbox list with no dangling indent.
  const siblingsHaveChildren = buckets.some((bucket) =>
    getBucketChildAgg(bucket),
  );

  return buckets.map((bucket) =>
    createFacetNode(bucket, context, siblingsHaveChildren, parentPath),
  );
};

const createFacetNode = (
  bucket: OpenSearchAggregationBucket,
  context: FacetRenderContext,
  siblingsHaveChildren: boolean,
  parentPath: string,
): HTMLElement => {
  const key = String(bucket.key);
  // The filter value is the full ancestor path (e.g. "Electronics>Tablet"),
  // which is what the endpoint filters against; the label shows just this key.
  const path = joinFacetPath(parentPath, key, context.pathSeparator);
  const child = getBucketChildAgg(bucket);
  const childrenId = `stx-facet-children-${facetNodeIdSeq++}`;

  const childrenPanel = child
    ? (html`
        <div
          id="${childrenId}"
          class="stx-results-panel__facet-children"
          hidden
        >
          ${createFacetNodeList(child.buckets, context, path)}
        </div>
      ` as HTMLElement)
    : "";

  let expander: HTMLElement | string = "";

  if (child) {
    expander = html`
      <button
        type="button"
        class="stx-results-panel__facet-subtoggle"
        aria-expanded="false"
        aria-controls="${childrenId}"
      >
        <span
          class="stx-results-panel__facet-chevron"
          aria-hidden="true"
        ></span>
      </button>
    ` as HTMLElement;

    expander.setAttribute("aria-label", `Toggle ${key} subcategories`);
  } else if (siblingsHaveChildren) {
    expander = html`
      <span
        class="stx-results-panel__facet-subtoggle-spacer"
        aria-hidden="true"
      ></span>
    ` as HTMLElement;
  }

  const node = html`
    <div class="stx-results-panel__facet-node">
      <div class="stx-results-panel__facet-row">
        ${expander}
        <label class="stx-results-panel__facet-option">
          <input type="checkbox" />
          <span class="stx-results-panel__facet-label"></span>
          <span class="stx-results-panel__facet-count"></span>
        </label>
      </div>
      ${childrenPanel}
    </div>
  ` as HTMLElement;

  // Bucket keys and field names come from the search index, so they are set via
  // the DOM rather than interpolated into the `html` template's innerHTML.
  const input = node.querySelector(
    FACET_OWN_INPUT_SELECTOR,
  ) as HTMLInputElement;

  input.name = context.treeField;
  input.dataset.facetId = context.treeField;
  input.value = path;

  const labelEl = node.querySelector(".stx-results-panel__facet-label");
  const countEl = node.querySelector(".stx-results-panel__facet-count");

  if (labelEl) {
    labelEl.textContent = key;
  }

  if (countEl) {
    countEl.textContent = String(bucket.doc_count);
  }

  return node;
};

const createFacetGroup = (
  field: string,
  aggregation: OpenSearchAggregation,
  panelState: PanelState,
  pathSeparator: string,
): HTMLElement | null => {
  const buckets = aggregation?.buckets || [];

  if (buckets.length === 0) {
    return null;
  }

  const valuesId = `stx-facet-values-${facetNodeIdSeq++}`;
  const context: FacetRenderContext = {
    panelState,
    pathSeparator,
    treeField: field,
  };

  const group = html`
    <div class="stx-results-panel__facet">
      <button
        type="button"
        class="stx-results-panel__facet-toggle"
        aria-expanded="false"
        aria-controls="${valuesId}"
      >
        <span class="stx-results-panel__facet-name"></span>
        <span
          class="stx-results-panel__facet-chevron"
          aria-hidden="true"
        ></span>
      </button>
      <div id="${valuesId}" class="stx-results-panel__facet-values" hidden>
        ${createFacetNodeList(buckets, context)}
      </div>
    </div>
  ` as HTMLElement;

  const nameEl = group.querySelector(".stx-results-panel__facet-name");

  if (nameEl) {
    nameEl.textContent = humanizeFacetName(field);
  }

  return group;
};

/* ------------------------------------------------------- facet tree walking */

const getFacetNodeInput = (node: Element) =>
  node.querySelector(FACET_OWN_INPUT_SELECTOR) as HTMLInputElement | null;

/**
 * Finds the checkbox of a node's direct parent, or `null` for a top-level node
 * (whose container is the values list rather than a children list).
 */
const findParentFacetInput = (input: HTMLInputElement) => {
  const node = input.closest(FACET_NODE_SELECTOR);
  const container = node?.parentElement;

  if (!container?.classList.contains("stx-results-panel__facet-children")) {
    return null;
  }

  const parentNode = container.closest(FACET_NODE_SELECTOR);

  return parentNode ? getFacetNodeInput(parentNode) : null;
};

/** The checkboxes one level below `node`, skipping deeper descendants. */
const getChildFacetInputs = (node: Element): HTMLInputElement[] => {
  const childrenPanel = node.querySelector(
    `:scope > ${FACET_CHILDREN_SELECTOR}`,
  );

  if (!childrenPanel) {
    return [];
  }

  return [...childrenPanel.querySelectorAll(`:scope > ${FACET_NODE_SELECTOR}`)]
    .map(getFacetNodeInput)
    .filter((input): input is HTMLInputElement => input !== null);
};

/** Hides a node's whole subtree — used once a branch is selected as a whole. */
const collapseFacetSubtree = (node: Element) => {
  node.querySelectorAll(FACET_CHILDREN_SELECTOR).forEach((panel) => {
    if (panel instanceof HTMLElement) {
      panel.hidden = true;
    }
  });

  node
    .querySelectorAll(".stx-results-panel__facet-subtoggle")
    .forEach((toggle) => {
      toggle.setAttribute("aria-expanded", "false");
    });
};

/* -------------------------------------------------------- facet selections */

const addSelection = (
  panelState: PanelState,
  treeField: string,
  path: string,
) => {
  const values = panelState.selectedFilters.get(treeField) ?? new Set<string>();

  values.add(path);
  panelState.selectedFilters.set(treeField, values);
};

const removeSelection = (
  panelState: PanelState,
  treeField: string,
  path: string,
) => {
  const values = panelState.selectedFilters.get(treeField);

  values?.delete(path);

  if (values?.size === 0) {
    panelState.selectedFilters.delete(treeField);
  }
};

/**
 * Drops every selection nested under `path`. Selecting a branch supersedes
 * anything selected beneath it, since the branch already matches those docs.
 */
const clearDescendantSelections = (
  panelState: PanelState,
  treeField: string,
  path: string,
  separator: string,
) => {
  const values = panelState.selectedFilters.get(treeField);

  if (!values) {
    return;
  }

  const prefix = `${path}${separator}`;

  [...values].forEach((value) => {
    if (value.startsWith(prefix)) {
      values.delete(value);
    }
  });

  if (values.size === 0) {
    panelState.selectedFilters.delete(treeField);
  }
};

const hasSelectedDescendant = (
  values: Set<string> | undefined,
  path: string,
  separator: string,
) => {
  if (!values) {
    return false;
  }

  const prefix = `${path}${separator}`;

  return [...values].some((value) => value.startsWith(prefix));
};

/**
 * Derives every checkbox's visual state from the selected set instead of
 * propagating it on click, so it stays correct across ticks, unticks and
 * re-renders: a node is `checked` when its own path is selected, and
 * `indeterminate` when only a path below it is. The indeterminate state is
 * purely visual — it never contributes a value to the request payload.
 */
const refreshFacetStates = (
  facetsContainer: HTMLElement,
  panelState: PanelState,
  separator: string,
) => {
  facetsContainer
    .querySelectorAll(".stx-results-panel__facet-option input")
    .forEach((element) => {
      if (!(element instanceof HTMLInputElement)) {
        return;
      }

      const treeField = element.dataset.facetId;
      const values = treeField
        ? panelState.selectedFilters.get(treeField)
        : undefined;
      const isChecked = values?.has(element.value) ?? false;

      element.checked = isChecked;
      element.indeterminate =
        !isChecked && hasSelectedDescendant(values, element.value, separator);
    });
};

/**
 * Once every child of a parent is selected, the children are replaced by the
 * parent itself: `(A OR B OR C)` becomes `(parent)`, which matches the same
 * documents while keeping the payload small. Applied upwards, so a fully
 * selected branch rolls up to its highest complete ancestor.
 */
const rollUpCompletedParents = (
  input: HTMLInputElement,
  panelState: PanelState,
  treeField: string,
  separator: string,
) => {
  let parentInput = findParentFacetInput(input);

  while (parentInput) {
    const parentNode = parentInput.closest(FACET_NODE_SELECTOR);

    if (!parentNode) {
      return;
    }

    const siblings = getChildFacetInputs(parentNode);
    const values = panelState.selectedFilters.get(treeField);
    const allSelected =
      siblings.length > 0 &&
      siblings.every((sibling) => values?.has(sibling.value));

    if (!allSelected) {
      return;
    }

    clearDescendantSelections(
      panelState,
      treeField,
      parentInput.value,
      separator,
    );
    addSelection(panelState, treeField, parentInput.value);
    collapseFacetSubtree(parentNode);

    parentInput = findParentFacetInput(parentInput);
  }
};

const initFacets = (
  facetsContainer: HTMLElement,
  panelState: PanelState,
  resultsPanel: HTMLElement,
  results: Results,
) => {
  facetsContainer
    .querySelectorAll(
      ".stx-results-panel__facet-toggle, .stx-results-panel__facet-subtoggle",
    )
    .forEach((toggle) => {
      const targetId = toggle.getAttribute("aria-controls");
      const valuesPanel = targetId
        ? facetsContainer.querySelector(`#${CSS.escape(targetId)}`)
        : toggle.nextElementSibling;

      if (!(valuesPanel instanceof HTMLElement)) {
        return;
      }

      toggle.addEventListener("click", () => {
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";

        toggle.setAttribute("aria-expanded", String(!isExpanded));
        valuesPanel.hidden = isExpanded;
      });
    });

  const separator = results.facetPathSeparator;

  facetsContainer
    .querySelectorAll(".stx-results-panel__facet-option input")
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        const checkbox = event.currentTarget;

        if (!(checkbox instanceof HTMLInputElement)) {
          return;
        }

        const treeField = checkbox.dataset.facetId;
        const path = checkbox.value;

        if (!treeField) {
          return;
        }

        if (checkbox.checked) {
          // The path already encodes its ancestors, so only the ticked value is
          // ever sent — never the chain above it. Anything ticked below it is
          // now redundant, so it is dropped and the subtree folds away.
          clearDescendantSelections(panelState, treeField, path, separator);
          addSelection(panelState, treeField, path);

          const node = checkbox.closest(FACET_NODE_SELECTOR);

          if (node) {
            collapseFacetSubtree(node);
          }

          rollUpCompletedParents(checkbox, panelState, treeField, separator);
        } else {
          removeSelection(panelState, treeField, path);
        }

        refreshFacetStates(facetsContainer, panelState, separator);
        buildResultsForPage(resultsPanel, results, 1);
      });
    });
};

/**
 * Builds the facets sidebar, or `null` when the response carries no usable
 * aggregations — a `GET` panel has none, and an empty `<aside>` would still
 * claim its 220px column.
 */
const createFacets = (
  data: OpenSearchResponse,
  panelState: PanelState,
  resultsPanel: HTMLElement,
  results: Results,
): HTMLElement | null => {
  const aggregations = data?.aggregations || {};

  const groups = Object.keys(aggregations)
    .map((field) =>
      createFacetGroup(
        field,
        aggregations[field],
        panelState,
        results.facetPathSeparator,
      ),
    )
    .filter((group): group is HTMLElement => group !== null);

  if (groups.length === 0) {
    panelState.facetsElement = null;

    return null;
  }

  const facetsContainer = html`
    <aside class="stx-results-panel__facets-container">${groups}</aside>
  ` as HTMLElement;

  initFacets(facetsContainer, panelState, resultsPanel, results);
  refreshFacetStates(facetsContainer, panelState, results.facetPathSeparator);
  panelState.facetsElement = facetsContainer;

  return facetsContainer;
};

const updateFacets = (
  resultsPanel: HTMLElement,
  data: OpenSearchResponse,
  results: Results,
  panelState: PanelState,
) => {
  const oldFacets = resultsPanel.querySelector(
    ".stx-results-panel__facets-container",
  );
  const newFacets = createFacets(data, panelState, resultsPanel, results);

  if (oldFacets && newFacets) {
    oldFacets.replaceWith(newFacets);
  } else if (oldFacets) {
    oldFacets.remove();
  } else if (newFacets) {
    resultsPanel.prepend(newFacets);
  }
};

/* ----------------------------------------------------------------- results */

/** `createPagination` yields an empty string when there is only one page. */
type PaginationElement = Element | HTMLCollection | string | null;

const bindPagination = (
  pagination: PaginationElement,
  resultsPanel: HTMLElement,
  results: Results,
) => {
  if (!(pagination instanceof HTMLElement)) {
    return;
  }

  pagination.querySelectorAll("button[data-page-number]").forEach((btn) => {
    const pageNumber = parseInt(btn.getAttribute("data-page-number") || "0");

    btn.addEventListener("click", () => {
      buildResultsForPage(resultsPanel, results, pageNumber);
    });
  });
};

const createResultsContainer = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const items = createItems(data, results.renderers);
  const resultsNumber = createResultsNumber(data, results, currentPage);
  const pagination = createPagination(data, results, currentPage);

  return {
    element: html`
      <div class="stx-results-panel__container">
        ${resultsNumber}
        <ul class="stx-results-panel__results-list">
          ${items}
        </ul>
        ${pagination}
      </div>
    ` as HTMLElement,
    pagination,
  };
};

const updateResultsMeta = (
  resultsContainer: HTMLElement,
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
  resultsPanel: HTMLElement,
) => {
  const totalNumber = data.hits?.total.value || 0;
  const pagesNumber = Math.ceil(totalNumber / results.pageSize);
  const pageNumberEl = resultsContainer.querySelector(
    ".stx-results-panel__page-number",
  );
  const totalNumberEl = resultsContainer.querySelector(
    ".stx-results-panel__total-number",
  );

  if (pageNumberEl) {
    pageNumberEl.textContent = results.labels.paginationInfo(
      currentPage,
      pagesNumber,
    );
  }

  if (totalNumberEl) {
    totalNumberEl.textContent = results.labels.totalResults(totalNumber);
  }

  const oldPagination = resultsContainer.querySelector(
    ".stx-results-panel__pagination-container",
  );
  const pagination = createPagination(data, results, currentPage);

  if (oldPagination) {
    if (pagination instanceof HTMLElement) {
      oldPagination.replaceWith(pagination);
    } else {
      oldPagination.remove();
    }
  } else if (pagination instanceof HTMLElement) {
    resultsContainer.append(pagination);
  }

  bindPagination(pagination, resultsPanel, results);
};

const updateResultsList = (
  resultsPanel: HTMLElement,
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const resultsContainer = resultsPanel.querySelector(
    ".stx-results-panel__container",
  );

  if (!(resultsContainer instanceof HTMLElement)) {
    return;
  }

  const listEl = resultsContainer.querySelector(
    ".stx-results-panel__results-list",
  );

  if (!(listEl instanceof HTMLElement)) {
    return;
  }

  // A renderer may yield a collection (or an empty string for "render nothing"),
  // so flatten before swapping the list contents.
  const items = (createItems(data, results.renderers) || []).flatMap((item) =>
    item instanceof HTMLCollection ? Array.from(item) : [item],
  );

  listEl.replaceChildren(...items);
  updateResultsMeta(resultsContainer, data, results, currentPage, resultsPanel);
  hideResultsLoading(resultsContainer);
  announceResults(results.labels.totalResults(data.hits.total.value));
};

const renderFullResults = (
  resultsPanel: HTMLElement,
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
  panelState: PanelState,
) => {
  const { element: resultsContainer, pagination } = createResultsContainer(
    data,
    results,
    currentPage,
  );
  const facetsContainer = createFacets(data, panelState, resultsPanel, results);

  resultsPanel.innerHTML = "";
  resultsPanel.append(
    ...(facetsContainer ? [facetsContainer] : []),
    resultsContainer,
  );
  panelState.resultsContainer = resultsContainer;

  bindPagination(pagination, resultsPanel, results);
  announceResults(results.labels.totalResults(data.hits.total.value));
};

interface BuildResultsOptions {
  /** Clears the selected facet filters — used when the query itself changes. */
  resetFilters?: boolean;
}

const buildResultsForPage = (
  resultsPanel: HTMLElement,
  results: Results,
  pageNumber: number,
  options: BuildResultsOptions = {},
) => {
  const { resetFilters = false } = options;
  const panelState = panelStates.get(resultsPanel);

  if (!panelState) {
    return;
  }

  const restorePageFocus = restoreFocusForPage();

  if (resetFilters) {
    panelState.selectedFilters.clear();
  }

  panelState.currentPage = pageNumber;

  const resultsContainer = resultsPanel.querySelector(
    ".stx-results-panel__container",
  );

  // Once the panel is rendered, update it in place (dim + swap) so it never
  // collapses to a centered loader and reflows the page. Only a brand-new query
  // rebuilds the facets — a facet change keeps them (and their expanded state).
  const hasContent = resultsContainer instanceof HTMLElement;

  if (hasContent) {
    showResultsLoading(resultsContainer);
  } else {
    resultsPanel.innerHTML = "";
    resultsPanel.append(results.renderers.loader());
    panelState.facetsElement = null;
  }

  const query = getSearchQuery(results.queryParam);
  const searchUrl = buildSearchUrl(results, pageNumber);
  const requestOptions = buildResultsRequestOptions(
    results,
    pageNumber,
    panelState.selectedFilters,
    query,
  );

  // A newer request supersedes the one in flight, so a slow page-2 response can
  // never land after the page-3 one the user actually asked for.
  panelState.request?.abort();

  const controller = new AbortController();

  panelState.request = controller;

  fetchSearchResults(searchUrl, query, controller.signal, requestOptions)
    .then((responseData) => {
      if (hasContent) {
        updateResultsList(resultsPanel, responseData, results, pageNumber);

        if (resetFilters) {
          updateFacets(resultsPanel, responseData, results, panelState);
        }
      } else {
        renderFullResults(
          resultsPanel,
          responseData,
          results,
          pageNumber,
          panelState,
        );
      }

      restorePageFocus();
    })
    .catch((error) => {
      // The request that replaced this one owns the loading state now.
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      if (hasContent) {
        hideResultsLoading(resultsContainer);
      } else {
        // Nothing has rendered yet, so leaving the loader in place would spin
        // forever — swap it for the error state instead.
        resultsPanel.innerHTML = "";
        resultsPanel.append(results.renderers.error(results.labels));
      }

      console.error(error);
    });
};

const addOnSearchParamChangeAction = (
  resultsPanel: HTMLElement,
  results: Results,
) => {
  const queryParam = results.queryParam;
  let prevSearchParam =
    new URL(window.location.href).searchParams.get(queryParam) || "";

  const onUrlChagne = () => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get(queryParam) || "";

    if (prevSearchParam !== searchQuery) {
      buildResultsForPage(resultsPanel, results, 1, { resetFilters: true });
      prevSearchParam = searchQuery;
    }
  };

  window.addEventListener("popstate", () => {
    onUrlChagne();
  });

  onUrlChange(() => {
    onUrlChagne();
  });
};

export const createResultsPanel = (resultsConfig: ResultsConfig | Results) => {
  const results = resolveConfig(resultsConfig);

  const resultsPanel = html`
    <div class="stx-results-panel">${results.renderers.loader()}</div>
  ` as HTMLDivElement;

  panelStates.set(resultsPanel, {
    currentPage: 1,
    selectedFilters: new Map(),
    facetsElement: null,
    resultsContainer: null,
    request: null,
  });

  try {
    buildResultsForPage(resultsPanel, results, 1);
    addOnSearchParamChangeAction(resultsPanel, results);

    return resultsPanel;
  } catch (error) {
    console.error(error);
    return results.renderers.error(results.labels);
  }
};
