import type { OpenSearchResponse } from "../../../types/open-search";
import { html } from "../../../helper";
import type { Results } from "../config/results-panel-config";

export const createResultsNumber = (
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
