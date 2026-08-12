import type { OpenSearchResponse } from "../../../types/open-search";
import { html } from "../../../helper";
import { createItems } from "./result-items";
import createPagination from "./pagination";
import { createResultsNumber } from "./results-number";
import type { Results } from "../config/results-panel-config";

export const createResultsContainer = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const items = createItems(data, results.renderers, results.debugMode);
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
