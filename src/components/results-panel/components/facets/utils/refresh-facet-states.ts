import type { PanelState } from "../../../panel-state.ts";
import { hasSelectedDescendant } from "./facet-selection.ts";

/**
 * Derives every checkbox's visual state from the selected set instead of
 * propagating it on click, so it stays correct across ticks, unticks and
 * re-renders: a node is `checked` when its own path is selected, and
 * `indeterminate` when only a path below it is. The indeterminate state is
 * purely visual - it never contributes a value to the request payload.
 */
export const refreshFacetStates = (
  facetsContainer: HTMLElement,
  panelState: PanelState,
  separator: string,
) => {
  facetsContainer
    .querySelectorAll(".stx-results-panel__facet-option input")
    .forEach((element) => {
      if (!(element instanceof HTMLInputElement)) {
        return;
      }

      const treeField = element.dataset.facetId;
      const values = treeField
        ? panelState.selectedFilters.get(treeField)
        : undefined;
      const isChecked = values?.has(element.value) ?? false;

      element.checked = isChecked;
      element.indeterminate =
        !isChecked && hasSelectedDescendant(values, element.value, separator);
    });
};
