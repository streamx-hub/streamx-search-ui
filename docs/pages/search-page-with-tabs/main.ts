import type { CustomRenderersSet } from "../../../src/components/results-panel/results-panel";
import type { TabConfig } from "../../../src/components/tabs/tabs";
import { html } from "../../../src/helper";
import type { OpenSearchItem } from "../../../src/types/open-search";
import { createSearchTabs } from "../../../src/exports/search-tabs";
import { addNavigation, renderCodeBlocks } from "../../js/helper";

const initSearchPage = async (mountPoint: Element) => {
  const renderers: CustomRenderersSet = {
    loader: () => {
      return html` <span>Loading</span> ` as HTMLSpanElement;
    },
    "item-products": (item: OpenSearchItem) => {
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

  const tabsConfig: TabConfig[] = [
    {
      id: "faqs",
      displayName: "Faqs",
      results: {
        dataSources: ["/results-data-tab-1.json"],
        renderers,
      },
    },
    {
      id: "info",
      displayName: "Firm info",
      results: {
        dataSources: ["/results-data-tab-2.json"],
      },
    },
    {
      id: "services",
      displayName: "Services & Solutions",
      results: {
        dataSources: ["/results-data-tab-3.json"],
      },
    },
    {
      id: "insights",
      displayName: "Insights & Resources",
      results: {
        dataSources: ["/results-data-tab-4.json"],
      },
    },
    {
      id: "econ",
      displayName: "Econ blog",
      results: {
        dataSources: ["/results-data-tab-5.json"],
      },
    },
    {
      id: "tech",
      displayName: "Tech blog",
      results: {
        dataSources: ["/results-data-tab-6.json"],
      },
    },
  ];

  const searchInputConfig = {
    searchApiUrl: "/search-data.json",
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

// adding code sippet to the doc
const examples = {
  default: `
  const tabsConfig = {...}
  const searchInputConfig = {...};
  const searchTabs = createSearchTabs(searchInputConfig, tabsConfig, renderers);
`,
};

renderCodeBlocks(examples);
addNavigation(document.body);
