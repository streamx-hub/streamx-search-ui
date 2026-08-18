export interface OpenSearchItemSourcePayload {
  title: string | null;
  /**
   * Shapes of fields and facets are defined by the index rather than
   * by this library.
   *
   * Deliberately `any`: consumers read it directly in their renderers (e.g.
   * `item._source.payload.fields.date`), and `unknown` would force a cast at every
   * such call site for no safety the index can actually guarantee.
   */
  fields?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  facets?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface OpenSearchItem {
  _id: string;
  _score: number | null;
  _source: {
    type?: string;
    /**
     * Namespace the document belongs to. The index prefixes `_id` with it
     * (e.g. `en:/en/blog/post`), so it is needed to resolve a usable URL.
     */
    namespace?: string | null;
    payload: OpenSearchItemSourcePayload;
  };
  highlight?: Record<string, string[]>;
}

/**
 * A single facet bucket.
 *
 * Besides `key`/`doc_count`, a bucket may carry a nested sub-aggregation keyed
 * by the child field name (e.g. `category_level1`) - that is how OpenSearch
 * returns hierarchical facets.
 */
export interface OpenSearchAggregationBucket {
  key: string;
  key_as_string?: string;
  doc_count: number;
  [childAggregation: string]: unknown;
}

export interface OpenSearchAggregation {
  doc_count_error_upper_bound?: number;
  sum_other_doc_count?: number;
  buckets: OpenSearchAggregationBucket[];
}

export interface OpenSearchResponse {
  took?: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation?: string;
    };
    hits?: OpenSearchItem[];
  };
  /** Facet aggregations, keyed by the requested field name. */
  aggregations?: Record<string, OpenSearchAggregation>;
}

/**
 * A facet aggregation requested for a query. `children` nests one level deeper,
 * which is how a hierarchical facet (e.g. category level 0 → 1 → 2) is asked for.
 */
export interface SearchFacetField {
  name: string;
  size: number;
  children?: SearchFacetField[];
  last?: boolean;
}

/**
 * A single filter clause. Values within one entry are OR-ed together; separate
 * entries are AND-ed.
 */
export interface SearchFilterField {
  name: string;
  values: string[];
  last?: boolean;
}

export type OpenSearchSortOrderField = `${string}_sort_order`;
export type OpenSearchSortOrder = "asc" | "desc";

/** Body sent to the search endpoint when using the POST transport. */
export interface SearchRequestBody {
  id?: string;
  params: {
    from: number;
    size: number;
    query?: string;
    /** Content namespace the results are limited to. */
    namespace?: string;
    facets: {
      fields: SearchFacetField[];
    };
    filter_query?: {
      fields: SearchFilterField[];
    };
    /* sort could be done for different field names, not just one specific */
    [key: OpenSearchSortOrderField]: OpenSearchSortOrder;
  };
}

export type SearchRequestMethod = "GET" | "POST";

/** Transport options for a single search request. */
export interface SearchRequestOptions {
  method?: SearchRequestMethod;
  body?: SearchRequestBody;
}
