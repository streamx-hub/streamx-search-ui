import type { OpenSearchResponse } from "../../../types/open-search";
import { createItems } from "../components/result-items";
import { announceResults } from "../components/live-region";
import createPagination from "../components/pagination";
import { bindPagination } from "./build-page-results";
import { renderResultsLoadingOverlay } from "../components/renderers";
import type { Results } from "../config/results-panel-config";

export const showResultsLoading = (resultsContainer: HTMLElement) => {
  resultsContainer.classList.add("stx-results-panel__container--loading");
  resultsContainer.setAttribute("aria-busy", "true");

  if (!resultsContainer.querySelector(".stx-results-panel__loading-overlay")) {
    resultsContainer.append(renderResultsLoadingOverlay());
  }
};

export const hideResultsLoading = (resultsContainer: HTMLElement) => {
  resultsContainer.classList.remove("stx-results-panel__container--loading");
  resultsContainer.removeAttribute("aria-busy");
  resultsContainer
    .querySelector(".stx-results-panel__loading-overlay")
    ?.remove();
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

export const updateResultsList = (
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
  const items = (
    createItems(data, results.renderers, results.debugMode) || []
  ).flatMap((item) =>
    item instanceof HTMLCollection ? Array.from(item) : [item],
  );

  listEl.replaceChildren(...items);
  updateResultsMeta(resultsContainer, data, results, currentPage, resultsPanel);
  hideResultsLoading(resultsContainer);
  announceResults(results.labels.totalResults(data.hits.total.value));
};
