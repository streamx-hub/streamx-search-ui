import { createResultsPanel } from "../../../src/exports/search-results-panel";
import { addNavigation, renderCodeBlocks } from "../../js/helper";

const initSearchPage = async (mountPoint: Element) => {
  const searchInputConfig = {
    searchApiUrl: "/search-data.json",
  };
  const resultsPanelConfig = {
    dataSources: ["/results-data-tab-1.json"],
  };
  const panel = createResultsPanel(searchInputConfig, resultsPanelConfig);

  mountPoint.append(panel);
};

const appEl = document.querySelector("#app");

if (appEl) {
  initSearchPage(appEl);
} else {
  throw new Error("The #app element is not available!");
}

// adding code sippet to the doc
const examples = {
  default: `
  const searchInputConfig = {...};
  const resultsPanelConfig = {...}
  const panel = createResultsPanel(searchInputConfig, resultsPanelConfig);`,
};

renderCodeBlocks(examples);
addNavigation(document.body);
