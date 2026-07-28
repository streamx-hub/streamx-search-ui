import type {
  SearchFacetField,
  SearchFilterField,
  SearchRequestBody,
} from "./types/open-search";

/**
 * Defaults for the facet field naming convention.
 *
 * They match the layout StreamX indexes use out of the box, but every one of
 * them is overridable per query so the components stay index-agnostic.
 */
export const DEFAULT_FACET_FIELD_PREFIX = "category_level";
export const DEFAULT_FACET_FILTER_FIELD = "category_hierarchy";
export const DEFAULT_FACET_PATH_SEPARATOR = ">";
export const DEFAULT_FACET_FIELD_SIZE = 20;

export interface BuildFacetFieldsOptions {
  /** How many levels deep the facet nests. Defaults to a single flat level. */
  depth?: number;
  /** Field name prefix; the level index is appended to it. */
  fieldPrefix?: string;
  /** Max buckets requested per level. */
  fieldSize?: number;
}

/**
 * Builds the facet aggregations requested for a query, `depth` levels deep:
 * `${fieldPrefix}0` nesting down to `${fieldPrefix}${depth - 1}`.
 *
 * A missing or invalid depth falls back to a single flat level.
 *
 * @example
 * buildFacetFields({ depth: 1 })
 * // { fields: [{ name: "category_level0", size: 20, last: true }] }
 *
 * @example
 * buildFacetFields({ depth: 2 })
 * // { fields: [{ name: "category_level0", size: 20,
 * //             children: [{ name: "category_level1", size: 20, last: true }],
 * //             last: true }] }
 */
export const buildFacetFields = ({
  depth,
  fieldPrefix = DEFAULT_FACET_FIELD_PREFIX,
  fieldSize = DEFAULT_FACET_FIELD_SIZE,
}: BuildFacetFieldsOptions = {}): { fields: SearchFacetField[] } => {
  const levels = Math.max(1, Math.trunc(Number(depth)) || 1);

  const buildLevel = (index: number): SearchFacetField => {
    const field: SearchFacetField = {
      name: `${fieldPrefix}${index}`,
      size: fieldSize,
    };

    if (index < levels - 1) {
      field.children = [buildLevel(index + 1)];
    }

    field.last = true;

    return field;
  };

  return { fields: [buildLevel(0)] };
};

/**
 * Joins a facet ancestor path.
 *
 * @example
 * joinFacetPath("Electronics", "Tablet") // "Electronics>Tablet"
 * joinFacetPath("", "Electronics") // "Electronics"
 */
export const joinFacetPath = (
  parentPath: string,
  key: string,
  separator: string = DEFAULT_FACET_PATH_SEPARATOR,
) => (parentPath ? `${parentPath}${separator}${key}` : key);

export interface BuildSearchRequestBodyOptions {
  /** Saved query/template id understood by the endpoint. */
  requestId?: string;
  from?: number;
  size?: number;
  query?: string;
  /**
   * Selected facet values, grouped by the facet **tree** they were selected
   * under - one key per top-level facet, whatever depth the values come from.
   */
  filters?: Record<string, string[]>;
  /** Field the selected facet values are filtered against. */
  filterField?: string;
  facetDepthLevel?: number;
  facetFieldPrefix?: string;
  facetFieldSize?: number;
  /**
   * Restricts results to one content namespace. Belongs inside `params` - the
   * endpoint returns HTTP 500 for a namespace at the body root.
   */
  namespace?: string;
}

/**
 * Builds the POST body for the search endpoint.
 *
 * Selected filters become `params.filter_query.fields`: one entry per facet
 * tree - values within a tree are OR-ed, separate trees are AND-ed - with
 * `last: true` on the final entry.
 *
 * Values are full hierarchical paths (`"Electronics>Tablet"`), so a nested
 * selection never needs its ancestors sent alongside it. Sending two branches
 * of one tree as separate entries would AND them and match nothing, which is
 * why grouping is per tree rather than per aggregation level.
 */
export const buildSearchRequestBody = ({
  requestId,
  from = 0,
  size = 20,
  query = "",
  filters,
  filterField = DEFAULT_FACET_FILTER_FIELD,
  facetDepthLevel,
  facetFieldPrefix,
  facetFieldSize,
  namespace,
}: BuildSearchRequestBodyOptions = {}): SearchRequestBody => {
  const body: SearchRequestBody = {
    params: {
      from,
      size,
      facets: buildFacetFields({
        depth: facetDepthLevel,
        fieldPrefix: facetFieldPrefix,
        fieldSize: facetFieldSize,
      }),
    },
  };

  if (requestId) {
    body.id = requestId;
  }

  if (query) {
    body.params.query = query;
  }

  if (namespace) {
    body.params.namespace = namespace;
  }

  const filterGroups = filters
    ? Object.values(filters).filter((values) => values.length > 0)
    : [];

  if (filterGroups.length > 0) {
    body.params.filter_query = {
      fields: filterGroups.map((values, index) => {
        const entry: SearchFilterField = { name: filterField, values };

        if (index === filterGroups.length - 1) {
          entry.last = true;
        }

        return entry;
      }),
    };
  }

  return body;
};
