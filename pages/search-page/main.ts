import type { TabConfig } from "../../src/components/tabs/tabs";

const searchApiUrl = () => {
  const mock1 = "/search-data.json";
  const mock2 = "/search-data-2.json";

  return Math.random() > 0.5 ? mock1 : mock2;
};

const initSearchPage = async (mountPoint: Element) => {
  const { createTextInput, createTabContent } =
    await import("../../src/search-results-page/index");

  createTextInput(mountPoint, {
    searchApiUrl,
  });

  const tabsConfig: TabConfig[] = [
    {
      id: "faqs",
      displayName: "Faqs",
      results: {
        dataSources: ["/results-data-tab-1.json"],
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

  createTabContent(mountPoint, tabsConfig);
};

const appEl = document.querySelector("#app");

if (appEl) {
  initSearchPage(appEl);
} else {
  throw new Error("The #app element is not available!");
}
