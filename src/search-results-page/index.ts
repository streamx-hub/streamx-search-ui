import { creatQueryInput } from "../components/query-input/query-input";
import { html } from "../helper";
import type { QueryInputConfig } from "../types/config";
import '../styles/common.css';
import createTabs, { type TabConfig } from "../components/tabs/tabs";

const createTextInput = (mountPoint: Element, customConfig: QueryInputConfig) => {
  const { element } = creatQueryInput(customConfig);

  const inputWrapper = html` <div class="">${element}</div> ` as HTMLElement;

  mountPoint.append(inputWrapper);
};

const createTabContent = (mountPoint: Element, config: TabConfig[]) => {
  const tabs = createTabs(config);

  mountPoint.append(tabs);
}

export { createTextInput, createTabContent };
