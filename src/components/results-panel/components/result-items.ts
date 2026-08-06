import type { OpenSearchResponse } from "../../../types/open-search";
import { renderNoItem } from "./renderers";
import { html } from "../../../helper";
import globalConfig from "../../../config";
import type { ResultsPanelRenderers } from "../config/results-panel-config";

export const createItems = (
  data: OpenSearchResponse,
  renderers: ResultsPanelRenderers,
  debugMode: boolean,
) => {
  // The legacy global `debug` flag (set via createSearchTabs(debug)) still
  // forces diagnostics on, so the per-panel flag only ever adds visibility.
  const showDebug = debugMode || globalConfig.debug;
  /** Result types with no renderer, counted so one summary is logged per render. */
  const unrendered = new Map<string, number>();

  const items = data.hits.hits
    ?.map((item) => {
      const { type } = item._source;
      const rendererName = `item-${type}`;
      let itemContent: HTMLElement | string;

      if (renderers[rendererName]) {
        try {
          itemContent = renderers[rendererName](item);
        } catch (error) {
          console.error(error);

          // A registered renderer threw. Surface it only in debug mode;
          // otherwise drop the row entirely.
          if (!showDebug) {
            return null;
          }

          itemContent = renderNoItem(item);
        }
      } else {
        unrendered.set(rendererName, (unrendered.get(rendererName) ?? 0) + 1);

        if (!showDebug) {
          // Nothing to render this type with: drop the row. The summary below
          // reports it, so a missing renderer is never silent.
          return null;
        }

        itemContent = html`
          <span class="stx-results-panel__missing-renderer">
            <span>Missing renderer for "item-${item?._source?.type}"</span>
            <span>${JSON.stringify(item)}</span>
          </span>
        ` as HTMLSpanElement;
      }

      return html`
        <li class="stx-results-panel__results-item">${itemContent}</li>
      ` as HTMLElement;
    })
    .filter((item): item is HTMLElement => item !== null);

  if (unrendered.size > 0) {
    const summary = [...unrendered.entries()]
      .map(([name, count]) => `${name} (x${count})`)
      .join(", ");

    // Logged in every mode: without it, dropped rows make the results list
    // disagree with the reported total for no visible reason.
    console.warn(
      `[streamx-search] No renderer registered for: ${summary}.`,
      showDebug
        ? "Shown in the list as a diagnostic because debugMode is on."
        : "Those results were left out of the list. Register an `item-<type>` renderer, or set debugMode to show them.",
    );
  }

  return items;
};
