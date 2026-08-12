import type { ResultsPanelRenderers } from "../../components/results-panel/config/results-panel-config";
import {
  type EDSInputOptions,
  type EDSPanelOptions,
  getEDSConfig,
  loadCssFile,
  readInputOptions,
  readPanelOptions,
  replaceElWithError,
} from "../../eds-helper";
import type { QueryInputRenderers } from "../../types/query-input";
import { createResultsPanel } from "../search-results-panel";

type EDSResultsPanelConfig = EDSPanelOptions &
  EDSInputOptions & {
    searchApiUrl: string;
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

  const inputOptions = readInputOptions(config);
  const inputConfig = {
    // Narrowed to a string by the guard above, which is why it stays here.
    searchApiUrl: config.searchApiUrl,
    ...inputOptions,
    renderers,
  };

  const resultsRenderers = Object.fromEntries(
    Object.entries(renderers || {}).filter(
      ([, renderer]) => renderer !== undefined,
    ),
  ) as ResultsPanelRenderers;
  const panelConfig = {
    ...readPanelOptions(config),
    queryParam: inputOptions.queryParam,
    renderers: resultsRenderers,
  };

  const resultPanel = createResultsPanel(inputConfig, panelConfig);

  block.append(resultPanel);
}
