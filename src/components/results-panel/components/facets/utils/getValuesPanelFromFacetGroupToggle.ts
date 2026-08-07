export function getValuesPanelFromFacetGroupToggle(
  facetGroupToggle: Element,
  facetsContainer: HTMLElement,
) {
  const targetId = facetGroupToggle.getAttribute("aria-controls");

  return targetId
    ? facetsContainer.querySelector(`#${CSS.escape(targetId)}`)
    : facetGroupToggle.nextElementSibling;
}
