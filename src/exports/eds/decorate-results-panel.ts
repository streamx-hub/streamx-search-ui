import type { ResultsPanelRenderers } from "../../components/results-panel/results-panel";
import {
  generatePannelLabels,
  getEDSConfig,
  loadCssFile,
  replaceElWithError,
} from "../../eds-helper";
import type { QueryInputRenderers } from "../../types/query-input";
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
    renderers: resultsRenderers,
    labels: generatePannelLabels(config),
  };

  const resultPanel = createResultsPanel(inputConfig, panelConfig);

  block.append(resultPanel);
}
