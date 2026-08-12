import type { ResultsPanelRenderers } from "../../components/results-panel/config/results-panel-config";
import {
  type EDSInputOptions,
  type EDSPanelOptions,
  getEDSConfig,
  loadCssFile,
  mergeEDSConfigs,
  readInputOptions,
  readPanelOptions,
  replaceElWithError,
} from "../../eds-helper";
import type { QueryInputRenderers } from "../../types/query-input";
import { createSearchTabs } from "../search-tabs";

// Panel options authored on the block act as defaults for every tab.
type EDSSearchTabsConfig = EDSPanelOptions &
  EDSInputOptions & {
    searchApiUrl: string;
  };

// Every panel option can be overridden per tab.
type EDSTabConfig = EDSPanelOptions & {
  id: string;
  displayName: string;
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

  const inputOptions = readInputOptions(config);
  const inputConfig = {
    // Narrowed to a string by the guard above, which is why it stays here.
    searchApiUrl: config.searchApiUrl,
    ...inputOptions,
    renderers,
  };

  const tabs = [...document.querySelectorAll(tabSelector)] as HTMLElement[];
  const tabsConfigs = tabs.map((tab) => {
    const tabConfig = getEDSConfig<EDSTabConfig>(tab);
    // Block-level panel options are the defaults; tab rows override key by key.
    const panelOptions = mergeEDSConfigs<EDSSearchTabsConfig & EDSTabConfig>(
      config,
      tabConfig,
    );

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

    if (!panelOptions.dataSources) {
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
        ...readPanelOptions(panelOptions),
        queryParam: inputOptions.queryParam,
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
