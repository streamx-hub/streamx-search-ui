import type {
  OpenSearchSortOrder,
  OpenSearchSortOrderField,
  SearchFacetField,
  SearchFilterField,
  SearchRequestBody,
} from "./types/open-search";
import { SORT_BY_SEPARATOR } from "./components/results-panel/sort-options.ts";

/**
 * The facet field naming convention.
 *
 * A facet is configured by its **root** name alone (`category`, `tags`, ...).
 * The surrounding names are fixed by the index layout: each nesting level is
 * aggregated on `<root>_level<n>`, and selections are filtered against
 * `<root>_hierarchy`, which stores the full ancestor paths.
 */
export const DEFAULT_FACET_FIELDS = ["category"];
export const FACET_LEVEL_SUFFIX = "_level";
export const FACET_HIERARCHY_SUFFIX = "_hierarchy";
export const DEFAULT_FACET_PATH_SEPARATOR = ">";
export const DEFAULT_FACET_FIELD_SIZE = 20;

/**
 * Maps an aggregation field back to the field its selections filter against,
 * so every facet tree filters on its own hierarchy instead of a shared one.
 *
 * @example
 * facetFilterFieldFor("tags_level0") // "tags_hierarchy"
 * facetFilterFieldFor("category_level2") // "category_hierarchy"
 */
export const facetFilterFieldFor = (treeField: string) => {
  const root = treeField.replace(new RegExp(`${FACET_LEVEL_SUFFIX}\\d+$`), "");

  return `${root}${FACET_HIERARCHY_SUFFIX}`;
};

export interface BuildFacetFieldsOptions {
  /** How many levels deep each facet nests. Defaults to a single flat level. */
  depth?: number;
  /** Facet root names - one aggregation tree is requested per entry. */
  fields?: string[];
  /** Max buckets requested per level. */
  fieldSize?: number;
}

/**
 * Builds the facet aggregations requested for a query: one tree per configured
 * root, each nesting `depth` levels from `<root>_level0`.
 *
 * A missing or invalid depth falls back to a single flat level.
 *
 * @example
 * buildFacetFields({ fields: ["category"] })
 * // { fields: [{ name: "category_level0", size: 20, last: true }] }
 *
 * @example
 * buildFacetFields({ fields: ["category"], depth: 2 })
 * // { fields: [{ name: "category_level0", size: 20,
 * //             children: [{ name: "category_level1", size: 20, last: true }],
 * //             last: true }] }
 *
 * @example
 * buildFacetFields({ fields: ["category", "tags"] })
 * // { fields: [{ name: "category_level0", ... }, { name: "tags_level0", ... }] }
 */
export const buildFacetFields = ({
  depth,
  fields = DEFAULT_FACET_FIELDS,
  fieldSize = DEFAULT_FACET_FIELD_SIZE,
}: BuildFacetFieldsOptions = {}): { fields: SearchFacetField[] } => {
  const levels = Math.max(1, Math.trunc(Number(depth)) || 1);
  const roots = fields.length > 0 ? fields : DEFAULT_FACET_FIELDS;

  const buildLevel = (
    root: string,
    index: number,
    isLast: boolean,
  ): SearchFacetField => {
    const field: SearchFacetField = {
      name: `${root}${FACET_LEVEL_SUFFIX}${index}`,
      size: fieldSize,
    };

    if (index < levels - 1) {
      field.children = [buildLevel(root, index + 1, true)];
    }

    if (isLast) {
      field.last = true;
    }

    return field;
  };

  return {
    fields: roots.map((root, idx) =>
      buildLevel(root, 0, idx === roots.length - 1),
    ),
  };
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
  facetDepthLevel?: number;
  /** Facet root names requested as aggregations. */
  facetFields?: string[];
  facetFieldSize?: number;
  /**
   * Restricts results to one content namespace. Belongs inside `params` - the
   * endpoint returns HTTP 500 for a namespace at the body root.
   */
  namespace?: string;
  /**
   * Sort field name and direction. Format: <sort-field-name>__<sort_direction>
   */
  sortBy?: string;
}

function extractSortInfo(sortBy: string): {
  sortField: OpenSearchSortOrderField;
  sortDirection: OpenSearchSortOrder;
} {
  const [sortFieldName, sortDirection] = sortBy.split(SORT_BY_SEPARATOR);
  const sortField: OpenSearchSortOrderField = `${sortFieldName}_sort_order`;

  if (sortDirection !== "asc" && sortDirection !== "desc") {
    console.warn("Invalid sort direction, fallbacks to desc");

    return {
      sortField,
      sortDirection: "desc",
    };
  }

  return {
    sortField,
    sortDirection,
  };
}

/**
 * Builds the POST body for the search endpoint.
 *
 * Selected filters become `params.filter_query.fields`: one entry per facet
 * tree - values within a tree are OR-ed, separate trees are AND-ed - with
 * `last: true` on the final entry. Each entry filters against that tree's own
 * `<root>_hierarchy` field, so two trees that share a value stay distinct.
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
  facetDepthLevel,
  facetFields,
  facetFieldSize,
  namespace,
  sortBy,
}: BuildSearchRequestBodyOptions = {}): SearchRequestBody => {
  const body: SearchRequestBody = {
    params: {
      from,
      size,
      facets: buildFacetFields({
        depth: facetDepthLevel,
        fields: facetFields,
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

  if (sortBy) {
    const { sortField, sortDirection } = extractSortInfo(sortBy);
    body.params[sortField] = sortDirection;
  }

  const filterGroups = filters
    ? Object.entries(filters).filter(([, values]) => values.length > 0)
    : [];

  if (filterGroups.length > 0) {
    body.params.filter_query = {
      fields: filterGroups.map(([treeField, values], index) => {
        const entry: SearchFilterField = {
          name: facetFilterFieldFor(treeField),
          values,
        };

        if (index === filterGroups.length - 1) {
          entry.last = true;
        }

        return entry;
      }),
    };
  }

  return body;
};
