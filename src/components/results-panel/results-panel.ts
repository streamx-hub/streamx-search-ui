import {
  onUrlChange,
  fetchSearchResults,
  html,
  normalizeLabels,
} from "../../helper";
import type { OpenSearchResponse } from "../../types/open-search";
import createPagination from "./pagination";
import {
  renderDefaultLoader,
  renderNoItem,
  renderResultsPanelError,
} from "./renderers";
import "./results-panel.css";

type CustomRenderer = (...args: any[]) => HTMLElement;

export type CustomRenderersSet = {
  [rendererName: string]: CustomRenderer;
};

export type ResultsPanelLabelsConfig = {
  paginationInfo?: (currentPage: number, pageNumber: number) => string;
  totalResults?: (totalCount: number) => string;
  ariaPaginationGoToPage?: (pageNumber: number) => string;
  ariaPaginationNavigation?: string;
};

export type ResultsPanelLabels = Required<ResultsPanelLabelsConfig>;

type ResultsPanelNormalizedLabels = {
  [K in keyof ResultsPanelLabels]: (...args: any[]) => string;
};

export interface ResultsConfig {
  pageSize?: number;
  dataSources: string[];
  renderers?: CustomRenderersSet;
  labels?: ResultsPanelLabelsConfig;
}

export type Results = Omit<Required<ResultsConfig>, "labels"> & {
  labels: ResultsPanelNormalizedLabels;
};

const defaultConfig = {
  pageSize: 20,
  renderers: {
    loader: renderDefaultLoader,
    error: renderResultsPanelError,
  },
  labels: {
    paginationInfo: (currentPage: number, pageNumber: number) =>
      `Page ${currentPage} of ${pageNumber}`,
    totalResults: (totalCount: number) => `${totalCount} results found.`,
    ariaPaginationGoToPage: (pageNumber: number) => `Go to page ${pageNumber}`,
    ariaPaginationNavigation: "Pagination",
  },
};

const resolveConfig = (resultsConfig: Results | ResultsConfig): Results => {
  const defaultLabels = normalizeLabels(defaultConfig.labels);
  const configLabels = resultsConfig.labels
    ? normalizeLabels(resultsConfig.labels)
    : {};

  return {
    ...defaultConfig,
    ...resultsConfig,
    renderers: {
      ...defaultConfig.renderers,
      ...resultsConfig.renderers,
    },
    labels: {
      ...defaultLabels,
      ...configLabels,
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
  let activePage: string | null;

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

const buildResultsForPage = (
  resultsPanel: HTMLElement,
  results: Results,
  pageNumber: number,
) => {
  const dataUrl = new URL(results.dataSources[0], window.location.href);
  const restorePageFocus = restoreFocusForPage();

  dataUrl.searchParams.set("from", String((pageNumber - 1) * results.pageSize));
  dataUrl.searchParams.set("size", String(results.pageSize));

  resultsPanel.innerHTML = "";
  resultsPanel.append(results.renderers.loader());

  const url = new URL(window.location.href);
  const searchQueryParam = url.searchParams.get("stx-search") || "";

  fetchSearchResults(dataUrl.toString(), searchQueryParam).then(
    (responseData) => {
      createResults(resultsPanel, responseData, results, pageNumber);
      restorePageFocus();
    },
  );
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
        ${results.labels.totalResults(data.hits?.total.value || 0)}
      </span>
    </div>
  ` as HTMLDivElement;
};

const createItems = (
  data: OpenSearchResponse,
  renderers: CustomRenderersSet,
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
        <span>
          <span>${item._id}</span>
          <span>${item._source?.type}</span>
        </span>
      ` as HTMLSpanElement;
    }

    return html`
      <li class="stx-results-panel__results-item">${itemContent}</li>
    ` as HTMLDivElement;
  });
};

const createFacets = () => {
  return html`
    <aside class="stx-results-panel__facets-container">
      FACETS

      <fieldset>
        <legend>Facet name</legend>
      </fieldset>
    </aside>
  `;
};

const createResults = (
  resultsPanel: HTMLElement,
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const items = createItems(data, results.renderers);
  const resultsNumber = createResultsNumber(data, results, currentPage);
  const pagination = createPagination(data, results, currentPage);

  resultsPanel.innerHTML = "";

  const newResults = html`
    ${createFacets()}
    <div class="stx-results-panel__container">
      ${resultsNumber}
      <ul>
        ${items}
      </ul>
      ${pagination}
    </div>
  ` as HTMLCollection;

  if (pagination) {
    const paginationButtons = pagination.querySelectorAll(
      "button[data-page-number]",
    );

    paginationButtons.forEach((btn) => {
      const pageNumber = parseInt(btn.getAttribute("data-page-number") || "0");

      btn.addEventListener("click", () => {
        buildResultsForPage(resultsPanel, results, pageNumber);
      });
    });
  }

  resultsPanel.append(...newResults);

  announceResults(results.labels.totalResults(data.hits.total.value));
};

const addOnSearchParamChangeAction = (
  resultsPanel: HTMLElement,
  results: Results,
) => {
  let prevSearchParam =
    new URL(window.location.href).searchParams.get("stx-search") || "";

  const onUrlChagne = () => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("stx-search") || "";

    if (prevSearchParam !== searchQuery) {
      buildResultsForPage(resultsPanel, results, 1);
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

  try {
    buildResultsForPage(resultsPanel, results, 1);
    addOnSearchParamChangeAction(resultsPanel, results);

    return resultsPanel;
  } catch (error) {
    console.error(error);
    return results.renderers.error(results.labels);
  }
};
