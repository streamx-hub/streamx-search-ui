import { addUrlChangeListener, fetchSearchResults, html } from "../../helper";
import type {
  OpenSearchItem,
  OpenSearchResponse,
} from "../../types/open-search";

const DEFAULT_RESULTS_CONFIG = {
  pageSize: 20,
  renderers: {},
};

type ResultRenderer = (item: OpenSearchItem) => HTMLElement | string;

export type ResultsRendererSet = {
  [renderName: string]: ResultRenderer;
};

export interface ResultsConfig {
  pageSize?: number;
  dataSources: string[];
  renderers?: ResultsRendererSet;
}

export type Results = Required<ResultsConfig>;

const createLoadingState = () => {
  return html`
    <span>
      <svg
        class="stx-results-panel__loader"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="48 16"
        ></circle>
      </svg>
    </span>
  ` as HTMLElement;
};

const buildResultsForPage = (
  resultsPanel: HTMLElement,
  results: Results,
  pageNumber: number,
) => {
  const dataUrl = new URL(results.dataSources[0], window.location.href);

  dataUrl.searchParams.set("from", String((pageNumber - 1) * results.pageSize));
  dataUrl.searchParams.set("size", String(results.pageSize));

  resultsPanel.innerHTML = "";
  resultsPanel.append(createLoadingState());

  const url = new URL(window.location.href);
  const searchQueryParam = url.searchParams.get("stx-search") || "";

  fetchSearchResults(dataUrl.toString(), searchQueryParam).then(
    (responseData) => {
      createResults(resultsPanel, responseData, results, pageNumber);
    },
  );
};

const createResultsNumber = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const totalNumber = data.hits.total.value;
  const pageSize = results.pageSize;
  const pagesNumber = Math.ceil(totalNumber / pageSize);

  return html`
    <div class="stx-results-panel__results-number">
      <span class="stx-results-panel__page-number"
        >Page ${currentPage} of ${pagesNumber}</span
      >
      <span class="stx-results-panel__total-number"
        >Total results: ${data.hits.total.value}</span
      >
    </div>
  ` as HTMLDivElement;
};

const createPagination = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const totalNumber = data.hits.total.value;
  const { pageSize } = results;
  const pagesCount = Math.ceil(totalNumber / pageSize);
  const paginationButtonList: HTMLElement[] = [];
  let paginationStartPage = currentPage - 2;

  if (pagesCount <= 1) {
    return "";
  }

  if (currentPage <= 3) {
    paginationStartPage = 1;
  } else if (currentPage >= pagesCount - 2) {
    paginationStartPage = pagesCount - 4;
  }

  if (paginationStartPage > 1) {
    paginationButtonList.push(
      html`<li class="stx-results-panel__pagination-list-item">
        <button data-page-number="1">1</a>
      </li>` as HTMLLinkElement,
    );
  }

  if (paginationStartPage > 2) {
    paginationButtonList.push(
      html`<li
        class="stx-results-panel__pagination-list-item stx-results-panel__pagination-dots "
        aria-hidden
      >
        ...
      </li>` as HTMLSpanElement,
    );
  }

  const paginationEndIndex =
    pagesCount < 5 ? pagesCount + 1 : paginationStartPage + 5;

  for (let i = paginationStartPage; i < paginationEndIndex; i++) {
    paginationButtonList.push(
      html`<li class="stx-results-panel__pagination-list-item">
        <button data-page-number="${i}" class="${currentPage === i ? "stx-is-active" : ""}">${i}</b>
      </li>` as HTMLLinkElement,
    );
  }

  if (paginationStartPage < pagesCount - 5) {
    paginationButtonList.push(
      html`<li
        class="stx-results-panel__pagination-list-item stx-results-panel__pagination-dots"
        aria-hidden
      >
        ...
      </li>` as HTMLSpanElement,
    );
  }

  if (paginationStartPage < pagesCount - 4) {
    paginationButtonList.push(
      html` <li class="stx-results-panel__pagination-list-item">
        <button data-page-number="${pagesCount}">${pagesCount}</button>
      </li>` as HTMLLinkElement,
    );
  }

  return html`
    <nav
      aria-label="Pagination"
      class="stx-results-panel__pagination-container"
    >
      <ul class="stx-results-panel__pagination-list">
        ${paginationButtonList}
      </ul>
    </nav>
  ` as HTMLDivElement;
};

const createItems = (
  data: OpenSearchResponse,
  renderers: ResultsRendererSet,
) => {
  return data.hits.hits.map((item) => {
    const { type } = item._source;
    let itemContent: HTMLElement | string;

    if (renderers[`item-${type}`]) {
      itemContent = renderers[`item-${type}`](item);
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

  addUrlChangeListener(() => {
    onUrlChagne();
  });
};

export const createResultsPanel = (resultsConfig: ResultsConfig) => {
  const results = { ...DEFAULT_RESULTS_CONFIG, ...resultsConfig };

  const resultsPanel = html`
    <div class="stx-results-panel">${createLoadingState()}</div>
  ` as HTMLDivElement;

  buildResultsForPage(resultsPanel, results, 1);

  addOnSearchParamChangeAction(resultsPanel, results);

  return resultsPanel;
};
