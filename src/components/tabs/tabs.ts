import { html, createLazyComponent } from "../../helper";
import { ACTIVE_TAB_PARAM } from "../../config";
import { createResultsPanel } from "../results-panel/results-panel";
import type {
  ResultsConfig,
  ResultsPanelRenderers,
} from "../results-panel/config/results-panel-config.ts";
import "./tabs.css";

export interface TabConfig {
  id: string;
  displayName: string;
  results: ResultsConfig;
}

export interface Tab {
  id: string;
  displayName: string;
  /**
   * Left unresolved on purpose - `createResultsPanel` applies the defaults and
   * normalizes the labels when the tab's panel is built.
   */
  results: ResultsConfig;
}

const resolvedTab = (
  tabsConfig: TabConfig[],
  customRenderers: ResultsPanelRenderers = {},
): Tab[] => {
  return tabsConfig.map((c) => ({
    ...c,
    // Per-tab labels ride along in `...c.results`; overwriting them here (as an
    // unused shared-labels parameter once did) silently dropped every label
    // authored on a tab.
    results: {
      pageSize: 10,
      ...c.results,
      // Namespaces this tab's facet URL param so tabs don't share a selection.
      stateKey: c.results?.stateKey ?? String(c.id),
      renderers: { ...customRenderers, ...c.results?.renderers },
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

  const { element, build } = createLazyComponent(() => {
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
  customRenderers?: ResultsPanelRenderers,
) {
  const tabs = resolvedTab(tabsConfig, customRenderers);

  // The active tab is mirrored in the URL so it survives a reload and can be
  // deep-linked. The param is only present for a non-default tab, keeping the
  // URL clean while the first tab is selected.
  const initialTabParam = new URLSearchParams(window.location.search).get(
    ACTIVE_TAB_PARAM,
  );
  const initialIndex = Math.max(
    0,
    tabs.findIndex((tab) => String(tab.id) === initialTabParam),
  );

  const updateActiveTabParam = (tabId: string, isDefault: boolean) => {
    const url = new URL(window.location.href);

    if (isDefault) {
      url.searchParams.delete(ACTIVE_TAB_PARAM);
    } else {
      url.searchParams.set(ACTIVE_TAB_PARAM, tabId);
    }

    window.history.replaceState({}, "", url);
  };

  const buttonList = tabs.map((el, index) =>
    createTabButton(el, index === initialIndex),
  );
  const tabsLazyMounts: (() => void)[] = [];
  const contentList: HTMLDivElement[] = [];

  tabs.forEach((el, index) => {
    const { element, build } = createTabContent(el, index === initialIndex);
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
    const selectedIndex = buttonList.indexOf(selectedTabButton);

    buttonList.forEach((button, index) => {
      const isSelected = index === selectedIndex;
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

    if (selectedIndex >= 0) {
      updateActiveTabParam(String(tabs[selectedIndex].id), selectedIndex === 0);
    }
  };

  tabsLazyMounts[initialIndex]();

  const onKeyDown = (e: KeyboardEvent) => {
    const { target } = e;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const currentButtonIndex = buttonList.indexOf(target);
    const tabCount = buttonList.length;
    // Every branch below either assigns this or returns, so no initial value.
    let nextIndex: number;

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
