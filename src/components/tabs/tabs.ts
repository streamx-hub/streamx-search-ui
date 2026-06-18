import { html } from "../../helper";

export type TabConfig = {
  id: string;
  displayName: string;
  dataSources: string[];
};

const getTabId = (id: string) => `stx-tab-${id}`;
const getTabContentId = (id: string) => `stx-tab-content-${id}`;

const createTabButton = (tabData: TabConfig, isSelected: boolean) => {
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

const createTabContent = (tabData: TabConfig, isSelected: boolean) => {
  const { id } = tabData;

  return html`
    <div
      id="${getTabContentId(id)}"
      role="tabpanel"
      aria-labelledby="${getTabId(id)}"
      class="stx-tabs__content"
      ${isSelected ? "" : "hidden"}
    >
      <div>Content of the tab: ${id}</div>
    </div>
  `;
};

function createTabs(tabsConfig: TabConfig[]) {
  const buttonList = tabsConfig.map((el, index) => createTabButton(el, !index));
  const contentList = tabsConfig.map((el, index) =>
    createTabContent(el, !index),
  );

  const tabs = html`
    <div class="stx-tabs">
      <div role="tablist" class="stx-tabs__buttons">${buttonList}</div>
      ${contentList}
    </div>
  ` as HTMLDivElement;

  const activateTab = (selectedTabButton: HTMLButtonElement) => {
    buttonList.forEach((button) => {
      const isSelected = button === selectedTabButton;
      const contentElId = button.getAttribute("aria-controls");
      const contentEl = tabs.querySelector(`#${contentElId}`);

      button.setAttribute("aria-selected", String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;

      if (contentEl && contentEl instanceof HTMLElement) {
        contentEl.hidden = !isSelected;
      }
    });
  };

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

  return tabs;
}

export default createTabs;
