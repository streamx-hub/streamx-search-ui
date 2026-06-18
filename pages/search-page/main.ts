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
      dataSources: [],
    },
    {
      id: "info",
      displayName: "Firm info",
      dataSources: [],
    },
    {
      id: "services",
      displayName: "Services & Solutions",
      dataSources: [],
    },
    {
      id: "insights",
      displayName: "Insights & Resources",
      dataSources: [],
    },
    {
      id: "econ",
      displayName: "Econ blog",
      dataSources: [],
    },
    {
      id: "tech",
      displayName: "Tech blog",
      dataSources: [],
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
