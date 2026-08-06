import type { SearchRequestOptions } from "../../../types/open-search";
import { buildSearchRequestBody } from "../../../search-request";
import { serializeFilters } from "./serialize-filters";
import type { Results } from "../config/results-panel-config";

export const buildResultsRequestOptions = (
  results: Results,
  pageNumber: number,
  selectedFilters: Map<string, Set<string>>,
  query: string,
): SearchRequestOptions => {
  if (results.method !== "POST") {
    return {};
  }

  return {
    method: "POST",
    body: buildSearchRequestBody({
      requestId: results.requestId,
      from: (pageNumber - 1) * results.pageSize,
      size: results.pageSize,
      query,
      filters: serializeFilters(selectedFilters),
      filterField: results.facetFilterField,
      facetDepthLevel: results.facetDepthLevel,
      facetFieldPrefix: results.facetFieldPrefix,
      facetFieldSize: results.facetFieldSize,
      namespace: results.namespace,
    }),
  };
};
