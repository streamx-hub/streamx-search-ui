import { FACET_CHILDREN_SELECTOR } from "../config/facet-selectors.ts";

/** Hides a node's whole subtree - used once a branch is selected as a whole. */
export const collapseFacetSubtree = (node: Element) => {
  node.querySelectorAll(FACET_CHILDREN_SELECTOR).forEach((panel) => {
    if (panel instanceof HTMLElement) {
      panel.hidden = true;
    }
  });

  node
    .querySelectorAll(".stx-results-panel__facet-subtoggle")
    .forEach((toggle) => {
      toggle.setAttribute("aria-expanded", "false");
    });
};
