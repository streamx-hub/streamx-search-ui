import type { PanelState } from "../../../panel-state.ts";
import {
  FACET_NODE_SELECTOR,
  findParentFacetInput,
  getChildFacetInputs,
} from "../config/facet-selectors.ts";
import { addSelection, clearDescendantSelections } from "./facet-selection.ts";
import { collapseFacetSubtree } from "./collapse-facet-subtree.ts";

/**
 * Once every child of a parent is selected, the children are replaced by the
 * parent itself: `(A OR B OR C)` becomes `(parent)`, which matches the same
 * documents while keeping the payload small. Applied upwards, so a fully
 * selected branch rolls up to its highest complete ancestor.
 */
export const rollUpCompletedParents = (
  input: HTMLInputElement,
  panelState: PanelState,
  treeField: string,
  separator: string,
) => {
  let parentInput = findParentFacetInput(input);

  while (parentInput) {
    const parentNode = parentInput.closest(FACET_NODE_SELECTOR);

    if (!parentNode) {
      return;
    }

    const siblings = getChildFacetInputs(parentNode);
    const values = panelState.selectedFilters.get(treeField);
    const allSelected =
      siblings.length > 0 &&
      siblings.every((sibling) => values?.has(sibling.value));

    if (!allSelected) {
      return;
    }

    clearDescendantSelections(
      panelState,
      treeField,
      parentInput.value,
      separator,
    );
    addSelection(panelState, treeField, parentInput.value);
    collapseFacetSubtree(parentNode);

    parentInput = findParentFacetInput(parentInput);
  }
};
