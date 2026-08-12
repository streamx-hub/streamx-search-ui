import type {
  OpenSearchAggregation,
  OpenSearchAggregationBucket,
} from "../../../../../types/open-search.ts";

interface FacetChildAggregation {
  field: string;
  buckets: OpenSearchAggregationBucket[];
}

/**
 * Finds a bucket's nested sub-aggregation, i.e. the property that is not one of
 * the bucket's own fields and carries its own `buckets` array.
 *
 * Guards against the degenerate shapes the backend returns when the requested
 * facet depth exceeds what the index actually nests (`parentField` is the
 * field the bucket itself belongs to):
 * - a bucket nesting its own field again (`category_level1` inside
 *   `category_level1`, holding a copy of the bucket) would render the node as
 *   its own child;
 * - an empty child aggregation would render an expander that opens onto
 *   nothing.
 * Both count as "no children".
 */
export const getBucketChildAgg = (
  bucket: OpenSearchAggregationBucket,
  parentField: string,
): FacetChildAggregation | null => {
  for (const key of Object.keys(bucket)) {
    if (key === "key" || key === "key_as_string" || key === "doc_count") {
      continue;
    }

    const value = bucket[key] as OpenSearchAggregation | undefined;

    if (
      value &&
      Array.isArray(value.buckets) &&
      key !== parentField &&
      value.buckets.length > 0
    ) {
      return { field: key, buckets: value.buckets };
    }
  }

  return null;
};
