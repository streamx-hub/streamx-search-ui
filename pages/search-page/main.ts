import type { TabConfig } from "../../src/components/tabs/tabs";

const searchApiUrl = () => {
  const mock1 = "/src/assets/mocks/search-data.json";
  const mock2 = "/src/assets/mocks/search-data-2.json";

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
        dataSources: ["/src/assets/mocks/results-data.json"],
      },
    },
    {
      id: "info",
      displayName: "Firm info",
      results: {
        dataSources: ["/src/assets/mocks/results-data.json"],
      },
    },
    {
      id: "services",
      displayName: "Services & Solutions",
      results: {
        dataSources: ["/src/assets/mocks/results-data.json"],
      },
    },
    {
      id: "insights",
      displayName: "Insights & Resources",
      results: {
        dataSources: ["/src/assets/mocks/results-data.json"],
      },
    },
    {
      id: "econ",
      displayName: "Econ blog",
      results: {
        dataSources: ["/src/assets/mocks/results-data.json"],
      },
    },
    {
      id: "tech",
      displayName: "Tech blog",
      results: {
        dataSources: ["/src/assets/mocks/results-data.json"],
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
