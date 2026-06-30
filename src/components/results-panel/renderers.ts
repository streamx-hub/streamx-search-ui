import globalConfig from "../../config";
import { html } from "../../helper";
import type { OpenSearchItem } from "../../types/open-search";

export const renderDefaultLoader = () => {
  return html`
    <span>
      <svg
        class="stx-results-panel__loader"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="48 16"
        ></circle>
      </svg>
    </span>
  ` as HTMLElement;
};

export const renderNoItem = (item: OpenSearchItem) => {
  if (globalConfig.debug) {
    return html`
      <div class="stx-results-panel__no-item-renderer">
        No custom renderer for type: ${item._source.type}
      </div>
    `;
  }

  return "";
};

export const renderResultsPanelError = () => {
  return html`
    <div class="stx-results-panel__error">
      <span class="stx-results-panel__error-heading">
        Something went wrong :(
      </span>
      <span class="stx-results-panel__error-text">
        Please try again later
      </span>
    </div>
  ` as HTMLElement;
};
