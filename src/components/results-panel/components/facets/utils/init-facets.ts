import type { PanelState } from "../../../panel-state.ts";
import type { Results } from "../../../config/results-panel-config.ts";
import {
  addSelection,
  clearDescendantSelections,
  removeSelection,
} from "./facet-selection.ts";
import { FACET_NODE_SELECTOR } from "../config/facet-selectors.ts";
import { collapseFacetSubtree } from "./collapse-facet-subtree.ts";
import { rollUpCompletedParents } from "./roll-up-completed-parents.ts";
import { refreshFacetStates } from "./refresh-facet-states.ts";
import { writeFacetsToUrl } from "./write-factets-to-url.ts";
import { facetsParamName } from "./facet-param-name.ts";
import { buildResultsForPage } from "../../../utils/build-page-results.ts";

export const initFacets = (
  facetsContainer: HTMLElement,
  panelState: PanelState,
  resultsPanel: HTMLElement,
  results: Results,
) => {
  facetsContainer
    .querySelectorAll(
      ".stx-results-panel__facet-toggle, .stx-results-panel__facet-subtoggle",
    )
    .forEach((toggle) => {
      const targetId = toggle.getAttribute("aria-controls");
      const valuesPanel = targetId
        ? facetsContainer.querySelector(`#${CSS.escape(targetId)}`)
        : toggle.nextElementSibling;

      if (!(valuesPanel instanceof HTMLElement)) {
        return;
      }

      toggle.addEventListener("click", () => {
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";

        toggle.setAttribute("aria-expanded", String(!isExpanded));
        valuesPanel.hidden = isExpanded;
      });
    });

  const separator = results.facetPathSeparator;

  facetsContainer
    .querySelectorAll(".stx-results-panel__facet-option input")
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        const checkbox = event.currentTarget;

        if (!(checkbox instanceof HTMLInputElement)) {
          return;
        }

        const treeField = checkbox.dataset.facetId;
        const path = checkbox.value;

        if (!treeField) {
          return;
        }

        if (checkbox.checked) {
          // The path already encodes its ancestors, so only the ticked value is
          // ever sent - never the chain above it. Anything ticked below it is
          // now redundant, so it is dropped and the subtree folds away.
          clearDescendantSelections(panelState, treeField, path, separator);
          addSelection(panelState, treeField, path);

          const node = checkbox.closest(FACET_NODE_SELECTOR);

          if (node) {
            collapseFacetSubtree(node);
          }

          rollUpCompletedParents(checkbox, panelState, treeField, separator);
        } else {
          removeSelection(panelState, treeField, path);
        }

        refreshFacetStates(facetsContainer, panelState, separator);
        writeFacetsToUrl(facetsParamName(results), panelState.selectedFilters);
        buildResultsForPage(resultsPanel, results, 1);
      });
    });
};
