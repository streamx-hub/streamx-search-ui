import globalConfig from "../config";
import { createQueryInput } from "../components/query-input/query-input";
import { html } from "../helper";
import createTabs, { type TabConfig } from "../components/tabs/tabs";
import type { ResultsPanelRenderers } from "../components/results-panel/config/results-panel-config";
import type { QueryInputConfig } from "../types/config";
import "../styles/common.css";

const createSearchTabs = (
  inputConfig: QueryInputConfig,
  tabsConfig: TabConfig[],
  resultsRenderers?: ResultsPanelRenderers,
  debug?: boolean,
) => {
  if (debug) {
    globalConfig.debug = true;
  }

  const searchInput = createQueryInput(inputConfig).element;
  const tabs = createTabs(tabsConfig, resultsRenderers);

  return html` <div class="stx-search-tabs">
    ${searchInput} ${tabs}
  </div>` as HTMLDivElement;
};

export { createSearchTabs };
export { getHitUrl } from "../renderers/renderers";

export type * from "../types/public";
