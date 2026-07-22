import type { ResultsPanelRenderers } from "../../components/results-panel/results-panel";
import {
  generatePannelLabels,
  getEDSConfig,
  loadCssFile,
  replaceElWithError,
} from "../../eds-helper";
import type { QueryInputRenderers } from "../../types/query-input";
import { DEFAULT_QUERY_PARAM } from "../../config";
import { createSearchTabs } from "../search-tabs";

type EDSSearchTabsConfig = {
  searchApiUrl: string;
  searchPageUrl?: string;
  minSearchLength?: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  clearButtonAria?: string;
  searchButtonAria?: string;
  /** URL param carrying the query. Shared by the input and the tab panels. */
  queryParam?: string;
  /** Query pre-fetched on render and offered while the input is empty. */
  initialQuery?: string;
  /** Block-level fallback for each tab's facet nesting depth. */
  facetDepthLevel?: string;
  /** Block-level fallback for the saved query/template id. */
  requestId?: string;
};

type EDSTabConfig = {
  id: string;
  displayName: string;
  pageSize?: string;
  dataSources: string;
  paginationInfo?: string;
  totalResults?: string;
  ariaPaginationGoToPage?: string;
  ariaPaginationNavigation?: string;
  /** Facet nesting depth for this tab; falls back to the block-level value. */
  facetDepthLevel?: string;
  /** Saved query/template id for this tab; falls back to the block-level value. */
  requestId?: string;
};

type EDSTabsRenderers = Partial<QueryInputRenderers> &
  Partial<ResultsPanelRenderers>;

export default function decorate(
  block: HTMLElement,
  tabSelector: string,
  renderers?: EDSTabsRenderers,
) {
  loadCssFile("/scripts/search/streamx-search.css");
  const config = getEDSConfig<EDSSearchTabsConfig>(block);

  block.innerHTML = "";

  if (!config.searchApiUrl) {
    replaceElWithError(
      block,
      "The <em>Search Tabs</em> block requires <i>searchApiUrl</i>",
    );

    return;
  }

  // The input writes this param and every tab panel reads it.
  const queryParam = config.queryParam || DEFAULT_QUERY_PARAM;

  const inputConfig = {
    searchApiUrl: config!.searchApiUrl,
    searchPageUrl: config.searchPageUrl
      ? (query: string) =>
          `${config.searchPageUrl}?${queryParam}=${encodeURIComponent(query)}`
      : undefined,
    minSearchLength: Number(config.minSearchLength) || 3,
    queryParam,
    initialQuery: config.initialQuery || undefined,
    // The tab panels sit right below, so submitting refreshes the active one in
    // place — unless the block points at a dedicated search page, which wins.
    submitInPlace: !config.searchPageUrl,
    labels: {
      inputPlaceholder: config.inputPlaceholder,
      inputLabel: config.inputLabel,
      clearButtonAria: config.clearButtonAria,
      searchButtonAria: config.searchButtonAria,
    },
    renderers,
  };

  const tabs = [...document.querySelectorAll(tabSelector)] as HTMLElement[];
  const tabsConfigs = tabs.map((tab) => {
    const tabConfig = getEDSConfig<EDSTabConfig>(tab);

    if (!tabConfig.id) {
      replaceElWithError(
        block,
        "The <em>Search Tab</em> block requires <i>id</i>",
      );

      return;
    }

    if (!tabConfig.displayName) {
      replaceElWithError(
        block,
        "The <em>Search Tab</em> block requires <i>displayName</i>",
      );

      return;
    }

    if (!tabConfig.dataSources) {
      replaceElWithError(
        block,
        "The <em>Search Tab</em> block requires <i>dataSources</i>",
      );

      return;
    }

    tab.remove();

    return {
      id: tabConfig.id,
      displayName: tabConfig.displayName,
      results: {
        pageSize: Number(tabConfig.pageSize) || 10,
        dataSources: [tabConfig.dataSources],
        // Facets and filtering travel in the request body, so results use POST.
        method: "POST" as const,
        queryParam,
        facetDepthLevel:
          Number(tabConfig.facetDepthLevel || config.facetDepthLevel) ||
          undefined,
        requestId: tabConfig.requestId || config.requestId || undefined,
        labels: generatePannelLabels(tabConfig),
      },
    };
  });

  const resultsRenderers = Object.fromEntries(
    Object.entries(renderers || {}).filter(
      ([, renderer]) => renderer !== undefined,
    ),
  ) as ResultsPanelRenderers;

  const searchTab = createSearchTabs(
    inputConfig,
    tabsConfigs.filter((tab) => tab !== undefined),
    resultsRenderers,
  );

  block.append(searchTab);
}
