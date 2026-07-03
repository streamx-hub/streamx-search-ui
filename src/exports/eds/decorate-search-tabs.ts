import type { ResultsPanelRenderers } from "../../components/results-panel/results-panel";
import {
  generatePannelLabels,
  getEDSConfig,
  loadCssFile,
  replaceElWithError,
} from "../../eds-helper";
import type { QueryInputRenderers } from "../../types/query-input";
import { createSearchTabs } from "../search-tabs";

type EDSSearchTabsConfig = {
  searchApiUrl: string;
  searchPageUrl?: string;
  minSearchLength?: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  clearButtonAria?: string;
  searchButtonAria?: string;
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

  const inputConfig = {
    searchApiUrl: config!.searchApiUrl,
    searchPageUrl: (query: string) =>
      `${config.searchPageUrl ?? ""}?stx-search=${encodeURIComponent(query)}`,
    minSearchLength: Number(config.minSearchLength) || 3,
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
