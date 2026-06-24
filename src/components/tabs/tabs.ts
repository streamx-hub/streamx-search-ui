import { html, lazyBuildComponent, normalizeLabels } from "../../helper";
import {
  createResultsPanel,
  type Results,
  type ResultsConfig,
  type CustomRenderersSet,
  type ResultsPanelLabelsConfig,
} from "../results-panel/results-panel";
import "./tabs.css";

export interface TabConfig {
  id: string;
  displayName: string;
  results: ResultsConfig;
}

export interface Tab {
  id: string;
  displayName: string;
  results: Results;
}

const resolvedTab = (
  tabsConfig: TabConfig[],
  customRenderers: CustomRenderersSet = {},
  labels: ResultsPanelLabelsConfig = {},
): Tab[] => {
  return tabsConfig.map((c) => ({
    ...c,
    results: {
      pageSize: 10,
      ...c.results,
      renderers: { ...customRenderers, ...c.results?.renderers },
      labels: normalizeLabels(labels),
    },
  }));
};

const getTabId = (id: string) => `stx-tab-${id}`;
const getTabContentId = (id: string) => `stx-tab-content-${id}`;

const createTabButton = (tabData: Tab, isSelected: boolean) => {
  const { id, displayName } = tabData;

  return html`
    <button
      id="${getTabId(id)}"
      role="tab"
      aria-selected="${String(isSelected)}"
      aria-controls="${getTabContentId(id)}"
      tabindex="${isSelected ? "0" : "-1"}"
      class="stx-tabs__button"
    >
      ${displayName}
    </button>
  ` as HTMLButtonElement;
};

const createTabContent = (tabData: Tab, isSelected: boolean) => {
  const { id } = tabData;

  const { element, build } = lazyBuildComponent(() => {
    return createResultsPanel(tabData.results);
  });

  const tabEl = html`
    <div
      id="${getTabContentId(id)}"
      role="tabpanel"
      aria-labelledby="${getTabId(id)}"
      class="stx-tabs__content"
      ${isSelected ? "" : "hidden"}
    >
      <div>${element}</div>
    </div>
  ` as HTMLDivElement;

  return {
    element: tabEl,
    build,
  };
};

function createTabs(
  tabsConfig: TabConfig[],
  customRenderers?: CustomRenderersSet,
) {
  const tabs = resolvedTab(tabsConfig, customRenderers);
  const buttonList = tabs.map((el, index) => createTabButton(el, !index));
  const tabsLazyMounts: (() => void)[] = [];
  const contentList: HTMLDivElement[] = [];

  tabs.forEach((el, index) => {
    const { element, build } = createTabContent(el, !index);
    tabsLazyMounts.push(build);
    contentList.push(element);
  });

  const tabsEl = html`
    <div class="stx-tabs">
      <div role="tablist" class="stx-tabs__buttons">${buttonList}</div>
      ${contentList}
    </div>
  ` as HTMLDivElement;

  const activateTab = (selectedTabButton: HTMLButtonElement) => {
    buttonList.forEach((button, index) => {
      const isSelected = button === selectedTabButton;
      const contentElId = button.getAttribute("aria-controls");
      const contentEl = tabsEl.querySelector(`#${contentElId}`);

      button.setAttribute("aria-selected", String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;

      if (contentEl && contentEl instanceof HTMLElement) {
        contentEl.hidden = !isSelected;

        if (isSelected) {
          tabsLazyMounts[index]();
        }
      }
    });
  };

  tabsLazyMounts[0]();

  const onKeyDown = (e: KeyboardEvent) => {
    const { target } = e;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const currentButtonIndex = buttonList.indexOf(target);
    const tabCount = buttonList.length;
    let nextIndex = currentButtonIndex;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        nextIndex = (currentButtonIndex + 1) % tabCount;
        break;

      case "ArrowLeft":
        e.preventDefault();
        nextIndex = (currentButtonIndex - 1 + tabCount) % tabCount;
        break;

      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;

      case "End":
        e.preventDefault();
        nextIndex = tabCount - 1;
        break;

      default:
        return;
    }

    if (nextIndex !== currentButtonIndex) {
      buttonList[nextIndex].focus();
      buttonList[nextIndex].click();
    }
  };

  buttonList.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab);
    });

    tab.addEventListener("keydown", (e) => {
      onKeyDown(e);
    });
  });

  return tabsEl;
}

export default createTabs;
