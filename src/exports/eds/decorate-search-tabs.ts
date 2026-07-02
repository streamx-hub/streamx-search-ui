import {
  getEDSConfig,
  loadCssFile,
  renderEDSLableTemplate,
  replaceElWithError,
} from "../../eds-helper";
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

export default function decorate(block: HTMLElement, tabSelector: string) {
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
    renderers: {},
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
        renderers: {},
        labels: {
          paginationInfo: (currentPage: number, pageNumber: number) =>
            renderEDSLableTemplate(tabConfig.paginationInfo, {
              currentPage,
              pageNumber,
            }),
          totalResults: (totalCount: number) =>
            renderEDSLableTemplate(tabConfig.totalResults, {
              totalCount,
            }),
          ariaPaginationGoToPage: (pageNumber: number) =>
            renderEDSLableTemplate(tabConfig.ariaPaginationGoToPage, {
              pageNumber,
            }),
          ariaPaginationNavigation: tabConfig.ariaPaginationNavigation,
        },
      },
    };
  });

  const resultsRenderers = {};
  const searchTab = createSearchTabs(
    inputConfig,
    tabsConfigs.filter((tab) => tab !== undefined),
    resultsRenderers,
  );

  block.append(searchTab);
}
