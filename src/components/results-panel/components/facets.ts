import type {
  OpenSearchAggregation,
  OpenSearchAggregationBucket,
  OpenSearchResponse,
} from "../../../types/open-search";
import type { PanelState } from "../panel-state";
import { joinFacetPath } from "../../../search-request";
import { html } from "../../../helper";
import { serializeFilters } from "../utils/serialize-filters";
import { buildResultsForPage } from "../utils/build-page-results";
import type { Results } from "../config/results-panel-config";

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
 *
 * Guards against the degenerate shapes the backend returns when the requested
 * facet depth exceeds what the index actually nests (`parentField` is the
 * field the bucket itself belongs to):
 * - a bucket nesting its own field again (`category_level1` inside
 *   `category_level1`, holding a copy of the bucket) would render the node as
 *   its own child;
 * - an empty child aggregation would render an expander that opens onto
 *   nothing.
 * Both count as "no children".
 */
const getBucketChildAgg = (
  bucket: OpenSearchAggregationBucket,
  parentField: string,
): FacetChildAggregation | null => {
  for (const key of Object.keys(bucket)) {
    if (key === "key" || key === "key_as_string" || key === "doc_count") {
      continue;
    }

    const value = bucket[key] as OpenSearchAggregation | undefined;

    if (
      value &&
      Array.isArray(value.buckets) &&
      key !== parentField &&
      value.buckets.length > 0
    ) {
      return { field: key, buckets: value.buckets };
    }
  }

  return null;
};

const createFacetNodeList = (
  field: string,
  buckets: OpenSearchAggregationBucket[],
  context: FacetRenderContext,
  parentPath = "",
): HTMLElement[] => {
  // Only reserve chevron space when at least one sibling actually nests, so a
  // fully flat facet renders as a clean checkbox list with no dangling indent.
  const siblingsHaveChildren = buckets.some((bucket) =>
    getBucketChildAgg(bucket, field),
  );

  return buckets.map((bucket) =>
    createFacetNode(field, bucket, context, siblingsHaveChildren, parentPath),
  );
};

const createFacetNode = (
  field: string,
  bucket: OpenSearchAggregationBucket,
  context: FacetRenderContext,
  siblingsHaveChildren: boolean,
  parentPath: string,
): HTMLElement => {
  const key = String(bucket.key);
  // The filter value is the full ancestor path (e.g. "Electronics>Tablet"),
  // which is what the endpoint filters against; the label shows just this key.
  const path = joinFacetPath(parentPath, key, context.pathSeparator);
  const child = getBucketChildAgg(bucket, field);
  const childrenId = `stx-facet-children-${facetNodeIdSeq++}`;

  const childrenPanel = child
    ? (html`
        <div
          id="${childrenId}"
          class="stx-results-panel__facet-children"
          hidden
        >
          ${createFacetNodeList(child.field, child.buckets, context, path)}
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
        ${createFacetNodeList(field, buckets, context)}
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

/** Hides a node's whole subtree - used once a branch is selected as a whole. */
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
 * purely visual - it never contributes a value to the request payload.
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

/**
 * Mirrors the current facet selection into the URL via `replaceState` (no
 * history entry per click), removing the param entirely when nothing is
 * selected so a shared link stays clean.
 */
export const writeFacetsToUrl = (
  paramName: string,
  selectedFilters: Map<string, Set<string>>,
) => {
  const url = new URL(window.location.href);
  const serialized = serializeFilters(selectedFilters);

  if (Object.keys(serialized).length > 0) {
    url.searchParams.set(paramName, JSON.stringify(serialized));
  } else {
    url.searchParams.delete(paramName);
  }

  window.history.replaceState({}, "", url);
};

const DEFAULT_FACETS_PARAM = "stx-facets";

/**
 * URL param the panel persists its facet selection under. Suffixed with the
 * panel's `stateKey` (the tab id inside search tabs) so sibling panels keep
 * separate selections in one URL.
 */
export const facetsParamName = (results: Results) =>
  results.stateKey
    ? `${DEFAULT_FACETS_PARAM}-${results.stateKey}`
    : DEFAULT_FACETS_PARAM;

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
          // ever sent - never the chain above it. Anything ticked below it is
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
        writeFacetsToUrl(facetsParamName(results), panelState.selectedFilters);
        buildResultsForPage(resultsPanel, results, 1);
      });
    });
};

/**
 * Builds the facets sidebar, or `null` when the response carries no usable
 * aggregations - a `GET` panel has none, and an empty `<aside>` would still
 * claim its 220px column.
 */
export const createFacets = (
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

export const updateFacets = (
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
