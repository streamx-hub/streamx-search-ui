import { fetchSearchResults, html } from "../../helper";
import type { OpenSearchResponse } from "../../types/open-search";

const DEFAULT_RESULTS_CONFIG = {
  pageSize: 20,
};

export interface ResultsConfig {
  pageSize?: number;
  dataSources: string[];
}

export type Results = Required<ResultsConfig>;

const getPaginationState = (results: Results) => {
  return {
    pageSize: results.pageSize,
    currentPage: 0,
  };
};

const createLoadingState = () => {
  return html`<span class="stx-results-panel__loader">Loading...</span>`;
};

const createResultsNumber = (data: OpenSearchResponse, results: Results) => {
  const totalNumber = data.hits.total.value;
  const { pageSize, currentPage } = getPaginationState(results);
  const pagesNumber = Math.ceil(totalNumber / pageSize);

  return html`
    <div class="stx-results-panel__results-number">
      <span class="stx-results-panel__page-number"
        >Page ${currentPage + 1} of ${pagesNumber}</span
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

  if (currentPage <= 3) {
    paginationStartPage = 1;
  } else if (currentPage >= pagesCount - 2) {
    paginationStartPage = pagesCount - 4;
  }

  if (paginationStartPage > 1) {
    paginationButtonList.push(
      html`<li class="stx-results-panel__pagination-list-item">
        <a href="/link-to-page">1</a>
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

  for (let i = paginationStartPage; i < paginationStartPage + 5; i++) {
    paginationButtonList.push(
      html`<li class="stx-results-panel__pagination-list-item">
        <a href="/link-to-page">${i}</a>
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
      html`<li class="stx-results-panel__pagination-list-item"><a href="/link-to-page">${pagesCount}</li>` as HTMLLinkElement,
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

const createItems = (data: OpenSearchResponse) => {
  return data.hits.hits.map((item) => {
    return html`
      <li class="stx-results-panel__results-item">
        <span>${item._id}</span>
        <span>${item._source.type}</span>
      </li>
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
  const items = createItems(data);
  const resultsNumber = createResultsNumber(data, results);

  resultsPanel.innerHTML = "";

  const newResults = html`
    ${createFacets()}
    <div class="stx-results-panel__container">
      ${resultsNumber}
      <ul>
        ${items}
      </ul>
      ${createPagination(data, results, currentPage)}
    </div>
  ` as HTMLCollection;

  resultsPanel.append(...newResults);
};

export const createResultsPanel = (resultsConfig: ResultsConfig) => {
  const results = { ...DEFAULT_RESULTS_CONFIG, ...resultsConfig };

  const dataUrl = results.dataSources[0]; // TODO: Should we support muliple data sources on one tab?

  const resultsPanel = html`
    <div class="stx-results-panel">${createLoadingState()}</div>
  ` as HTMLDivElement;

  fetchSearchResults(dataUrl).then((responseData) => {
    createResults(resultsPanel, responseData, results, 1);
  });

  return resultsPanel;
};
