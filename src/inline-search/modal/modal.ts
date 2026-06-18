import { html, trapFocus } from "../../helper";
import "./modal.css";
import type { Modal } from "../../types/config";
import { creatQueryInput } from "../../components/query-input/query-input";

const createSearchModal = (config: Modal) => {
  const { element: queryInput, inputEl } = creatQueryInput(config.input);

  const dialogEl = html`
    <dialog class="stx-search-modal">${queryInput}</dialog>
  ` as HTMLDialogElement;

  let restoreFocus: (() => void) | null;

  if (!dialogEl || !inputEl) {
    throw new Error("test");
  }

  const openModal = () => {
    if (dialogEl.open) {
      return;
    }

    restoreFocus = trapFocus();

    if (config.useNonModal) {
      dialogEl.show();
    } else {
      dialogEl.showModal();
    }
    inputEl.focus();

    config?.analytics?.({
      type: "streamx_modal_search_open",
    });
  };

  const closeModal = () => {
    if (!dialogEl.open) {
      return;
    }

    dialogEl.close();
  };

  dialogEl.addEventListener("close", () => {
    if (restoreFocus) {
      restoreFocus();
    }

    config?.analytics?.({
      type: "streamx_modal_search_close",
    });
  });

  dialogEl.addEventListener("click", (e) => {
    if (e.target && e.target === dialogEl) {
      dialogEl.close();
    }
  });

  return {
    element: dialogEl,
    openModal,
    closeModal,
  };
};

export { createSearchModal };
