import type { OpenSearchResponse } from "../../../types/open-search";
import { html } from "../../../helper";
import type { Results } from "../config/results-panel-config";
import { createSortOptions } from "../sort-options";

export const paginationInfoLabel = (
  results: Results,
  currentPage: number,
  totalNumber: number,
) => {
  const pagesNumber = Math.ceil(totalNumber / results.pageSize);

  return pagesNumber > 0
    ? results.labels.paginationInfo(currentPage, pagesNumber)
    : "";
};

export const createResultsHeader = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const totalNumber = data.hits?.total.value || 0;
  const sortOptions = createSortOptions(
    results.sortParam,
    results.labels.sortBy(),
    results.sortFields,
    results.labels.defaultSortOption(),
  );

  return html`
    <div class="stx-results-panel__results-header">
      <span class="stx-results-panel__page-number">
        ${paginationInfoLabel(results, currentPage, totalNumber)}
      </span>
      <span class="stx-results-panel__total-number">
        ${results.labels.totalResults(totalNumber)}
      </span>
      ${sortOptions?.element}
    </div>
  ` as HTMLDivElement;
};
