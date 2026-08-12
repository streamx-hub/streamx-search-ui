import type { OpenSearchResponse } from "../../../../types/open-search";
import type { PanelState } from "../../panel-state";
import { html } from "../../../../helper";
import type { Results } from "../../config/results-panel-config";
import { createFacetGroup } from "./components/facet-group.ts";
import { refreshFacetStates } from "./utils/refresh-facet-states.ts";
import { initFacets } from "./utils/init-facets.ts";
import { getValuesPanelFromFacetGroupToggle } from "./utils/getValuesPanelFromFacetGroupToggle.ts";

/**
 * Builds the facets sidebar, or `null` when the response carries no usable
 * aggregations - a `GET` panel has none, and an empty `<aside>` would still
 * claim its 220px column.
 */
export const createFacets = (
  data: OpenSearchResponse,
  panelState: PanelState,
  resultsPanel: HTMLElement,
  results: Results,
): HTMLElement | null => {
  const aggregations = data?.aggregations || {};

  const groups = Object.entries(aggregations)
    .map(([field, fieldAgg]) =>
      createFacetGroup(field, fieldAgg, panelState, results.facetPathSeparator),
    )
    .filter((group): group is HTMLElement => group !== null);

  if (groups.length === 0) {
    panelState.facetsElement = null;

    return null;
  }

  const facetsContainer = html`
    <aside class="stx-results-panel__facets-container">${groups}</aside>
  ` as HTMLElement;

  initFacets(facetsContainer, panelState, resultsPanel, results);
  refreshFacetStates(facetsContainer, panelState, results.facetPathSeparator);
  panelState.facetsElement = facetsContainer;

  return facetsContainer;
};

export const updateFacets = (
  resultsPanel: HTMLElement,
  data: OpenSearchResponse,
  results: Results,
  panelState: PanelState,
) => {
  const oldFacets = resultsPanel.querySelector<HTMLElement>(
    ".stx-results-panel__facets-container",
  );
  const newFacets = createFacets(data, panelState, resultsPanel, results);
  preserveFacetGroupsExpandedState(newFacets, oldFacets);

  if (oldFacets && newFacets) {
    oldFacets.replaceWith(newFacets);
  } else if (oldFacets) {
    oldFacets.remove();
  } else if (newFacets) {
    resultsPanel.prepend(newFacets);
  }
};

function preserveFacetGroupsExpandedState(
  newFacetsContainer: HTMLElement | null,
  oldFacetsContainer: HTMLElement | null,
) {
  if (!newFacetsContainer || !oldFacetsContainer) return;

  newFacetsContainer
    .querySelectorAll(".stx-results-panel__facet-toggle")
    .forEach((element) => {
      const equivalentOld = oldFacetsContainer.querySelector(
        `button.stx-results-panel__facet-toggle#${element.id}`,
      );

      const isExpanded =
        equivalentOld?.getAttribute("aria-expanded") === "true";
      element.setAttribute("aria-expanded", `${isExpanded}`);

      const valuesPanel = getValuesPanelFromFacetGroupToggle(
        element,
        newFacetsContainer,
      );
      if (!(valuesPanel instanceof HTMLElement)) {
        return;
      }

      valuesPanel.hidden = !isExpanded;
    });
}
