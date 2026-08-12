import type { OpenSearchAggregationBucket } from "../../../../../types/open-search.ts";
import type { FacetRenderContext } from "../config/facet-render-context.ts";
import { getBucketChildAgg } from "../utils/get-bucket-child-agg.ts";
import { joinFacetPath } from "../../../../../search-request.ts";
import { html } from "../../../../../helper.ts";
import { FACET_OWN_INPUT_SELECTOR } from "../config/facet-selectors.ts";
import { facetNodeCounter } from "../utils/facet-node-counter.ts";

const createFacetNode = (
  field: string,
  bucket: OpenSearchAggregationBucket,
  context: FacetRenderContext,
  siblingsHaveChildren: boolean,
  parentPath: string,
): HTMLElement => {
  const key = String(bucket.key);
  // The filter value is the full ancestor path (e.g. "Electronics>Tablet"),
  // which is what the endpoint filters against; the label shows just this key.
  const path = joinFacetPath(parentPath, key, context.pathSeparator);
  const child = getBucketChildAgg(bucket, field);
  const childrenId = `stx-facet-children-${facetNodeCounter.getCounter()}`;

  const childrenPanel = child
    ? (html`
        <div
          id="${childrenId}"
          class="stx-results-panel__facet-children"
          hidden
        >
          ${createFacetNodeList(child.field, child.buckets, context, path)}
        </div>
      ` as HTMLElement)
    : "";

  let expander: HTMLElement | string = "";

  if (child) {
    expander = html`
      <button
        type="button"
        class="stx-results-panel__facet-subtoggle"
        aria-expanded="false"
        aria-controls="${childrenId}"
      >
        <span
          class="stx-results-panel__facet-chevron"
          aria-hidden="true"
        ></span>
      </button>
    ` as HTMLElement;

    expander.setAttribute("aria-label", `Toggle ${key} subcategories`);
  } else if (siblingsHaveChildren) {
    expander = html`
      <span
        class="stx-results-panel__facet-subtoggle-spacer"
        aria-hidden="true"
      ></span>
    ` as HTMLElement;
  }

  const node = html`
    <div class="stx-results-panel__facet-node">
      <div class="stx-results-panel__facet-row">
        ${expander}
        <label class="stx-results-panel__facet-option">
          <input type="checkbox" />
          <span class="stx-results-panel__facet-label"></span>
          <span class="stx-results-panel__facet-count"></span>
        </label>
      </div>
      ${childrenPanel}
    </div>
  ` as HTMLElement;

  // Bucket keys and field names come from the search index, so they are set via
  // the DOM rather than interpolated into the `html` template's innerHTML.
  const input = node.querySelector(
    FACET_OWN_INPUT_SELECTOR,
  ) as HTMLInputElement;

  input.name = context.treeField;
  input.dataset.facetId = context.treeField;
  input.value = path;

  const labelEl = node.querySelector(".stx-results-panel__facet-label");
  const countEl = node.querySelector(".stx-results-panel__facet-count");

  if (labelEl) {
    labelEl.textContent = key;
  }

  if (countEl) {
    countEl.textContent = String(bucket.doc_count);
  }

  return node;
};

export const createFacetNodeList = (
  field: string,
  buckets: OpenSearchAggregationBucket[],
  context: FacetRenderContext,
  parentPath = "",
): HTMLElement[] => {
  // Only reserve chevron space when at least one sibling actually nests, so a
  // fully flat facet renders as a clean checkbox list with no dangling indent.
  const siblingsHaveChildren = buckets.some((bucket) =>
    getBucketChildAgg(bucket, field),
  );

  return buckets.map((bucket) =>
    createFacetNode(field, bucket, context, siblingsHaveChildren, parentPath),
  );
};
