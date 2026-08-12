import { createResultsPanel } from "../../../src/exports/search-results-panel";
import { addNavigation, renderCodeBlocks } from "../../js/helper";
import type {
  ResultsConfig,
  ResultsPanelRenderers,
} from "../../../src/components/results-panel/config/results-panel-config";
import type { OpenSearchItem } from "../../../src/types/open-search";
import { html } from "../../../src/helper";

const initSearchPage = async (mountPoint: Element) => {
  const renderers: ResultsPanelRenderers = {
    "item-page/eds": (item: OpenSearchItem) => {
      return html`
        <article class="custom-result-item-render">
          <img src="${item._source.image}" alt="" />
          <div class="custom-result-item-render__text">
            <span>Custom render for <em>products</em></span>
            <span>${item._id}</span>
            <span>${item._source.type}</span>
            <a href="${item._source.link}">
              <span>${item._source.description}</span>
            </a>
          </div>
        </article>
      ` as HTMLDivElement;
    },
  };
  const searchInputConfig = {
    searchApiUrl: "http://localhost:8082/search/pages",
  };
  const resultsPanelConfig: ResultsConfig = {
    facetFields: ["category", "technology", "event"],
    facetDepthLevel: 2,
    dataSources: ["http://localhost:8082/search/query/body"],
    method: "POST",
    requestId: "eds-pages",
    renderers,
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
