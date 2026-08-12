import type { OpenSearchResponse } from "../../../types/open-search";
import { html } from "../../../helper";
import type { Results } from "../config/results-panel-config";
import { createSortOptions } from "../sort-options";

export const createResultsHeader = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const totalNumber = data.hits?.total.value || 0;
  const pageSize = results.pageSize;
  const pagesNumber = Math.ceil(totalNumber / pageSize);
  const sortOptions = createSortOptions(
    results.sortParam,
    results.labels.sortBy(),
    results.sortOptions,
  );

  return html`
    <div class="stx-results-panel__results-header">
      <span class="stx-results-panel__page-number">
        ${results.labels.paginationInfo(currentPage, pagesNumber)}
      </span>
      <span class="stx-results-panel__total-number">
        ${results.labels.totalResults(totalNumber)}
      </span>
      ${sortOptions?.element}
    </div>
  ` as HTMLDivElement;
};
