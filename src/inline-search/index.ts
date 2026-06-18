import type { Modal, ModalConfig, QueryInputConfig } from "../types/config.js";
import { createSearchModal } from "./modal/modal.js";
import DEFAULT_CONFIG from "./default-config.js";
import { creatQueryInput } from "../components/query-input/query-input.js";
import '../styles/common.css';

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

export function createSearchInModal(customConfig: ModalConfig) {
  const config: Modal = {
    ...DEFAULT_CONFIG,
    ...customConfig,
    input: {
      ...DEFAULT_CONFIG.input,
      ...customConfig.input,
      labels: { ...DEFAULT_CONFIG.input.labels, ...customConfig.input.labels },
      renderers: {
        ...DEFAULT_CONFIG.input.renderers,
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

export function createTextInput(
  mountPoint: Element,
  customConfig: QueryInputConfig,
) {
  const { element } = creatQueryInput(customConfig);

  if (mountPoint.tagName === "INPUT") {
    mountPoint.replaceWith(element);
  } else {
    mountPoint.append(element);
  }
}
