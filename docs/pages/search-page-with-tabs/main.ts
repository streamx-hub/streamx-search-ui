import type {
  ResultsConfig,
  ResultsPanelRenderers,
} from "../../../src/components/results-panel/config/results-panel-config";
import type { TabConfig } from "../../../src/components/tabs/tabs";
import { html } from "../../../src/helper";
import type { OpenSearchItem } from "../../../src/types/open-search";
import { createSearchTabs } from "../../../src/exports/search-tabs";
import { addNavigation, renderCodeBlocks } from "../../js/helper";

const initSearchPage = async (mountPoint: Element) => {
  const renderers: ResultsPanelRenderers = {
    loader: () => {
      return html` <span>Loading</span> ` as HTMLSpanElement;
    },
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

  const resultsConfig: ResultsConfig = {
    facetFields: ["category", "technology", "event"],
    facetDepthLevel: 2,
    dataSources: ["http://localhost:8082/search/query/body"],
    method: "POST",
    requestId: "eds-pages",
    renderers,
  };

  const tabsConfig: TabConfig[] = [
    {
      id: "faqs",
      displayName: "Faqs",
      results: {
        ...resultsConfig,
      },
    },
    {
      id: "info",
      displayName: "Firm info",
      results: {
        ...resultsConfig,
      },
    },
    {
      id: "services",
      displayName: "Services & Solutions",
      results: {
        ...resultsConfig,
      },
    },
    {
      id: "insights",
      displayName: "Insights & Resources",
      results: {
        ...resultsConfig,
      },
    },
    {
      id: "econ",
      displayName: "Econ blog",
      results: {
        ...resultsConfig,
      },
    },
    {
      id: "tech",
      displayName: "Tech blog",
      results: {
        ...resultsConfig,
      },
    },
  ];

  const searchInputConfig = {
    searchApiUrl: "http://localhost:8082/search/pages",
  };
  const searchTabs = createSearchTabs(searchInputConfig, tabsConfig, renderers);

  mountPoint?.append(searchTabs);
};

const appEl = document.querySelector("#app");

if (appEl) {
  initSearchPage(appEl);
} else {
  throw new Error("The #app element is not available!");
}

// adding code snippet to the doc
const examples = {
  default: `
  const tabsConfig = {...}
  const searchInputConfig = {...};
  const searchTabs = createSearchTabs(searchInputConfig, tabsConfig, renderers);
`,
};

renderCodeBlocks(examples);
addNavigation(document.body);
