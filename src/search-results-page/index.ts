import globalConfig from "../config";
import { creatQueryInput } from "../components/query-input/query-input";
import { html } from "../helper";
import type { QueryInputConfig } from "../types/config";
import "../styles/common.css";
import createTabs, { type TabConfig } from "../components/tabs/tabs";
import type { CustomRenderersSet } from "../components/results-panel/results-panel";

const createTextInput = (
  mountPoint: Element,
  customConfig: QueryInputConfig,
) => {
  const { element } = creatQueryInput(customConfig);

  const inputWrapper = html`<div class="">${element}</div>` as HTMLElement;

  mountPoint.append(inputWrapper);
};

const createTabContent = (
  mountPoint: Element,
  config: TabConfig[],
  renderers?: CustomRenderersSet,
  debug?: boolean,
) => {
  if (debug) {
    globalConfig.debug = true;
  }

  const tabs = createTabs(config, renderers);

  mountPoint.append(tabs);
};

export { createTextInput, createTabContent };
