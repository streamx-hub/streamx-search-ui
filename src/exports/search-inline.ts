import type { Modal, ModalConfig, QueryInputConfig } from "../types/config.js";
import { createSearchModal } from "../inline-search/modal/modal.js";
import defaultConfig from "../inline-search/default-config.js";
import { createQueryInput } from "../components/query-input/query-input.js";
import "../styles/common.css";

export type ModalData = {
  openModal: () => void;
  closeModal: () => void;
};

const getTriggerOpenEl = (searchOpenElementSelector: string) => {
  if (!searchOpenElementSelector) {
    throw new Error("No trigger selector provided!");
  }

  const triggerEl = document.querySelector(searchOpenElementSelector);

  if (!triggerEl) {
    throw new Error(
      `No trigger element found! Used selector: "${searchOpenElementSelector}`,
    );
  }

  return triggerEl;
};

const getTriggerCloseEl = (searchCloseElementSelector: string) => {
  if (!searchCloseElementSelector) {
    return;
  }

  const triggerCloseEl = document.querySelector(searchCloseElementSelector);

  return triggerCloseEl;
};

const bootstrapModal = (config: Modal): ModalData => {
  const { openModal, closeModal, element } = createSearchModal(config);

  document.body.append(element);

  return {
    openModal,
    closeModal,
  };
};

export function mountSearchModal(customConfig: ModalConfig) {
  const config: Modal = {
    ...defaultConfig,
    ...customConfig,
    input: {
      ...defaultConfig.input,
      ...customConfig.input,
      labels: { ...defaultConfig.input.labels, ...customConfig.input.labels },
      renderers: {
        ...defaultConfig.input.renderers,
        ...customConfig.input.renderers,
      },
    },
  };

  const { searchOpenElementSelector, searchCloseElementSelector } = config;
  const triggerEl = getTriggerOpenEl(searchOpenElementSelector);
  let modalData: ModalData | null = null;

  triggerEl.addEventListener("click", () => {
    if (!modalData) {
      modalData = bootstrapModal(config);
    }

    modalData.openModal();
  });

  if (searchCloseElementSelector) {
    const triggerCloseEl = getTriggerCloseEl(searchCloseElementSelector);

    if (triggerCloseEl) {
      triggerCloseEl.addEventListener("click", () => {
        if (modalData) {
          modalData.closeModal();
        }
      });
    }
  }
}

export function createSearchInput(
  customConfig: QueryInputConfig,
  mountPoint: Element,
) {
  const { element } = createQueryInput(customConfig);

  if (mountPoint.tagName === "INPUT") {
    mountPoint.replaceWith(element);
  } else {
    mountPoint.append(element);
  }

  return element;
}

export { getHitUrl } from "../renderers/renderers";
