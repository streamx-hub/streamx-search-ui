export const FACET_NODE_SELECTOR = ".stx-results-panel__facet-node";
export const FACET_CHILDREN_SELECTOR = ".stx-results-panel__facet-children";
export const FACET_OWN_INPUT_SELECTOR =
  ":scope > .stx-results-panel__facet-row .stx-results-panel__facet-option input";

const getFacetNodeInput = (node: Element) =>
  node.querySelector(FACET_OWN_INPUT_SELECTOR) as HTMLInputElement | null;

/**
 * Finds the checkbox of a node's direct parent, or `null` for a top-level node
 * (whose container is the values list rather than a children list).
 */
export const findParentFacetInput = (input: HTMLInputElement) => {
  const node = input.closest(FACET_NODE_SELECTOR);
  const container = node?.parentElement;

  if (!container?.classList.contains("stx-results-panel__facet-children")) {
    return null;
  }

  const parentNode = container.closest(FACET_NODE_SELECTOR);

  return parentNode ? getFacetNodeInput(parentNode) : null;
};

/** The checkboxes one level below `node`, skipping deeper descendants. */
export const getChildFacetInputs = (node: Element): HTMLInputElement[] => {
  const childrenPanel = node.querySelector(
    `:scope > ${FACET_CHILDREN_SELECTOR}`,
  );

  if (!childrenPanel) {
    return [];
  }

  return [...childrenPanel.querySelectorAll(`:scope > ${FACET_NODE_SELECTOR}`)]
    .map(getFacetNodeInput)
    .filter((input): input is HTMLInputElement => input !== null);
};
