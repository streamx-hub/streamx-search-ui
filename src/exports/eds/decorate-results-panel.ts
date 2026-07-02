import {
  getEDSConfig,
  loadCssFile,
  renderEDSLableTemplate,
  replaceElWithError,
} from "../../eds-helper";
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
};

export default function decorate(block: HTMLElement) {
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

  const inputConfig = {
    searchApiUrl: config.searchApiUrl,
    searchPageUrl: config.searchPageUrl
      ? (query: string) =>
          `${config.searchPageUrl}?stx-search=${encodeURIComponent(query)}`
      : undefined,
    minSearchLength: Number(config.minSearchLength) || 3,
    labels: {
      inputPlaceholder: config.inputPlaceholder,
      inputLabel: config.inputLabel,
      clearButtonAria: config.clearButtonAria,
      searchButtonAria: config.searchButtonAria,
    },
    renderers: {},
  };

  const panelConfig = {
    pageSize: Number(config.pageSize) || 10,
    dataSources: config.dataSources ? [config.dataSources] : [],
    renderers: {},
    labels: {
      paginationInfo: (currentPage: number, pageNumber: number) =>
        renderEDSLableTemplate(config.paginationInfo, {
          currentPage,
          pageNumber,
        }),
      totalResults: (totalCount: number) =>
        renderEDSLableTemplate(config.totalResults, {
          totalCount,
        }),
      ariaPaginationGoToPage: (pageNumber: number) =>
        renderEDSLableTemplate(config.ariaPaginationGoToPage, {
          pageNumber,
        }),
      ariaPaginationNavigation: config.ariaPaginationNavigation,
    },
  };

  const resultPanel = createResultsPanel(inputConfig, panelConfig);

  block.append(resultPanel);
}
