import type { ResultsPanelRenderers } from "../../components/results-panel/results-panel";
import {
  generatePannelLabels,
  getEDSConfig,
  loadCssFile,
  replaceElWithError,
} from "../../eds-helper";
import type { QueryInputRenderers } from "../../types/query-input";
import { DEFAULT_QUERY_PARAM } from "../../config";
import { createResultsPanel } from "../search-results-panel";

type EDSResultsPanelConfig = {
  searchApiUrl: string;
  searchPageUrl?: string;
  minSearchLength?: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  clearButtonAria?: string;
  searchButtonAria?: string;
  pageSize?: string;
  dataSources?: string;
  paginationInfo?: string;
  totalResults?: string;
  ariaPaginationGoToPage?: string;
  ariaPaginationNavigation?: string;
  /** URL param carrying the query. Shared by the input and the panel. */
  queryParam?: string;
  /** Query pre-fetched on render and offered while the input is empty. */
  initialQuery?: string;
  /** How deep the facet aggregations nest. Defaults to a single flat level. */
  facetDepthLevel?: string;
  /** Saved query/template id sent as the request body `id`. */
  requestId?: string;
  /** Field the selected facet values are filtered against. */
  facetFilterField?: string;
  /** Field name prefix for the facet levels. */
  facetFieldPrefix?: string;
};

type EDSResultsPanelRenderers = Partial<QueryInputRenderers> &
  Partial<ResultsPanelRenderers>;

export default function decorate(
  block: HTMLElement,
  renderers?: EDSResultsPanelRenderers,
) {
  loadCssFile("/scripts/search/streamx-search.css");
  const config = getEDSConfig<EDSResultsPanelConfig>(block);

  block.innerHTML = "";

  if (!config.searchApiUrl) {
    replaceElWithError(
      block,
      "The <em>Results panel</em> block requires <i>searchApiUrl</i>",
    );

    return;
  }

  // The input writes this param and the panel reads it, so both get the same one.
  const queryParam = config.queryParam || DEFAULT_QUERY_PARAM;

  const inputConfig = {
    searchApiUrl: config.searchApiUrl,
    searchPageUrl: config.searchPageUrl
      ? (query: string) =>
          `${config.searchPageUrl}?${queryParam}=${encodeURIComponent(query)}`
      : undefined,
    minSearchLength: Number(config.minSearchLength) || 3,
    queryParam,
    initialQuery: config.initialQuery || undefined,
    // The results panel sits right below, so submitting refreshes it in place -
    // unless the block points at a dedicated search page, which then wins.
    submitInPlace: !config.searchPageUrl,
    labels: {
      inputPlaceholder: config.inputPlaceholder,
      inputLabel: config.inputLabel,
      clearButtonAria: config.clearButtonAria,
      searchButtonAria: config.searchButtonAria,
    },
    renderers,
  };

  const resultsRenderers = Object.fromEntries(
    Object.entries(renderers || {}).filter(
      ([, renderer]) => renderer !== undefined,
    ),
  ) as ResultsPanelRenderers;
  const panelConfig = {
    pageSize: Number(config.pageSize) || 10,
    dataSources: config.dataSources ? [config.dataSources] : [],
    // Facets and filtering travel in the request body, so results use POST.
    method: "POST" as const,
    queryParam,
    facetDepthLevel: Number(config.facetDepthLevel) || undefined,
    requestId: config.requestId || undefined,
    facetFilterField: config.facetFilterField || undefined,
    facetFieldPrefix: config.facetFieldPrefix || undefined,
    renderers: resultsRenderers,
    labels: generatePannelLabels(config),
  };

  const resultPanel = createResultsPanel(inputConfig, panelConfig);

  block.append(resultPanel);
}
