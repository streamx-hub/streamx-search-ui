import globalConfig from "../config";
import { creatQueryInput } from "../components/query-input/query-input";
import { html } from "../helper";
import createTabs, { type TabConfig } from "../components/tabs/tabs";
import type { CustomRenderersSet } from "../components/results-panel/results-panel";
import type { QueryInputConfig } from "../types/config";
import "../styles/common.css";

const createSearchTabs = (
  inputConfig: QueryInputConfig,
  tabsConfig: TabConfig[],
  resultsRenderers?: CustomRenderersSet,
  debug?: boolean,
) => {
  if (debug) {
    globalConfig.debug = true;
  }

  const searchInput = creatQueryInput(inputConfig).element;
  const tabs = createTabs(tabsConfig, resultsRenderers);

  return html` <div class="stx-search-tabs">
    ${searchInput} ${tabs}
  </div>` as HTMLDivElement;
};

export { createSearchTabs };
