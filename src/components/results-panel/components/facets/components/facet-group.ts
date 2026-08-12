import type { OpenSearchAggregation } from "../../../../../types/open-search.ts";
import type { PanelState } from "../../../panel-state.ts";
import type { FacetRenderContext } from "../config/facet-render-context.ts";
import { html } from "../../../../../helper.ts";
import { createFacetNodeList } from "./facet-node-list.ts";
import { facetNodeCounter } from "../utils/facet-node-counter.ts";

/** Turns an aggregation field name into a heading, e.g. `category_level0` → `Category`. */
const humanizeFacetName = (field: string) =>
  field
    .replace(/_level\d+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || field;

export const createFacetGroup = (
  field: string,
  aggregation: OpenSearchAggregation,
  panelState: PanelState,
  pathSeparator: string,
): HTMLElement | null => {
  const buckets = aggregation?.buckets || [];

  if (buckets.length === 0) {
    return null;
  }

  const valuesId = `stx-facet-values-${facetNodeCounter.getCounter()}`;
  const context: FacetRenderContext = {
    panelState,
    pathSeparator,
    treeField: field,
  };

  const group = html`
    <div class="stx-results-panel__facet">
      <button
        type="button"
        class="stx-results-panel__facet-toggle"
        aria-expanded="false"
        aria-controls="${valuesId}"
      >
        <span class="stx-results-panel__facet-name"></span>
        <span
          class="stx-results-panel__facet-chevron"
          aria-hidden="true"
        ></span>
      </button>
      <div id="${valuesId}" class="stx-results-panel__facet-values" hidden>
        ${createFacetNodeList(field, buckets, context)}
      </div>
    </div>
  ` as HTMLElement;

  const nameEl = group.querySelector(".stx-results-panel__facet-name");

  if (nameEl) {
    nameEl.textContent = humanizeFacetName(field);
  }

  return group;
};
