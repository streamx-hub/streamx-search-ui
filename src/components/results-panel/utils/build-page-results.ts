import { type PanelState, panelStates } from "../panel-state";
import { createFacets, updateFacets } from "../components/facets/facets.ts";
import { facetsParamName } from "../components/facets/utils/facet-param-name";
import { fetchSearchResults } from "../../../helper";
import type { OpenSearchResponse } from "../../../types/open-search";
import { createResultsContainer } from "../components/results-container";
import { announceResults } from "../components/live-region";
import {
  hideResultsLoading,
  showResultsLoading,
  updateResultsList,
} from "./update-results-list";
import { buildResultsRequestOptions } from "./build-results-request-options";
import { buildSearchUrl } from "./build-search-url";
import type { Results } from "../config/results-panel-config";
import { writeFacetsToUrl } from "../components/facets/utils/write-factets-to-url.ts";

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

const getSearchQuery = (queryParam: string) =>
  new URL(window.location.href).searchParams.get(queryParam) || "";

/** `createPagination` yields an empty string when there is only one page. */
type PaginationElement = Element | HTMLCollection | string | null;

export const bindPagination = (
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
  /** Clears the selected facet filters - used when the query itself changes. */
  resetFilters?: boolean;
}

export const buildResultsForPage = (
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
    // A new query drops the old facets, so the shared URL must not keep them.
    writeFacetsToUrl(facetsParamName(results), panelState.selectedFilters);
  }

  panelState.currentPage = pageNumber;

  const resultsContainer = resultsPanel.querySelector(
    ".stx-results-panel__container",
  );

  // Once the panel is rendered, update it in place (dim + swap) so it never
  // collapses to a centered loader and reflows the page. Only a brand-new query
  // rebuilds the facets - a facet change keeps them (and their expanded state).
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
        updateFacets(resultsPanel, responseData, results, panelState);
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
        // forever - swap it for the error state instead.
        resultsPanel.innerHTML = "";
        resultsPanel.append(results.renderers.error(results.labels));
      }

      console.error(error);
    });
};
