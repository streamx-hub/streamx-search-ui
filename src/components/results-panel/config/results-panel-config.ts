import type { SearchRequestMethod } from "../../../types/open-search";
import { DEFAULT_QUERY_PARAM, DEFAULT_SORT_PARAM } from "../../../config";
import {
  DEFAULT_FACET_FIELDS,
  DEFAULT_FACET_FIELD_SIZE,
  DEFAULT_FACET_PATH_SEPARATOR,
} from "../../../search-request";
import {
  renderDefaultLoader,
  renderResultsPanelError,
} from "../components/renderers";
import { normalizeLabels } from "../../../helper";

/**
 * Deliberate `any` to as we anyway cannot guarantee safety there,
 * and we want to avoid forced type-cast in every field of `ResultsPanelRenderers`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomRenderer = (...args: any[]) => HTMLElement;

export type ResultsPanelRenderers = {
  [rendererName: string]: CustomRenderer;
};

export type ResultsPanelLabelsConfig = {
  paginationInfo?: (currentPage: number, pageNumber: number) => string;
  totalResults?: (totalCount: number) => string;
  ariaPaginationGoToPage?: (pageNumber: number) => string;
  ariaPaginationNavigation?: string;
  sortBy?: string;
  /* Selecting default sort option will result in removing sort URL param  */
  defaultSortOption?: string;
};

export type ResultsPanelLabels = Required<ResultsPanelLabelsConfig>;

/**
 * Labels after normalization: a label given as a plain string becomes a getter,
 * while a label given as a function keeps its own signature.
 */
type ResultsPanelNormalizedLabels = {
  [K in keyof ResultsPanelLabels]: NonNullable<ResultsPanelLabels[K]> extends (
    ...args: infer A
  ) => string
    ? (...args: A) => string
    : () => string;
};

export interface ResultsConfig {
  pageSize?: number;
  dataSources: string[];
  renderers?: ResultsPanelRenderers;
  labels?: ResultsPanelLabelsConfig;
  /**
   * Transport used to fetch results. `POST` is required for facets and
   * filtering, since those travel in the request body.
   */
  method?: SearchRequestMethod;
  /** URL param carrying the active query. Must match the query input's. */
  queryParam?: string;
  /** How deep the facet aggregations nest. Defaults to a single flat level. */
  facetDepthLevel?: number;
  /** Saved query/template id sent as the request body `id`. */
  requestId?: string;
  /**
   * Facet roots to request, one aggregation tree each (`["category", "tags"]`).
   * Level and filter fields are derived: `<root>_level<n>` is aggregated and
   * selections filter against `<root>_hierarchy`.
   */
  facetFields?: string[];
  /** Separator used to build hierarchical facet paths. */
  facetPathSeparator?: string;
  /** Max buckets requested per facet level. */
  facetFieldSize?: number;
  /**
   * Renders debug diagnostics in the results list - the "Missing renderer"
   * notice for a result type with no registered renderer, and a notice when a
   * renderer throws. Defaults to `false`, which drops those rows entirely.
   */
  debugMode?: boolean;
  /**
   * Namespaces this panel's facet-selection URL param so sibling panels (e.g.
   * search tabs) each persist their own facets without colliding. Set
   * automatically to the tab id inside search tabs; omit for a standalone panel.
   */
  stateKey?: string;
  /**
   * Restricts results to one content namespace. Sent as a `namespace` query
   * param on `GET` and inside the request body's `params` on `POST`. Omit to
   * search across all namespaces.
   */
  namespace?: string;
  /**
   * Sort field names which will be available to sort both in ascending and descending direction.
   */
  sortFields?: string[];
  /** URL param carrying sort option. Must match the sort options element's. */
  sortParam?: string;
}

export type Results = Omit<
  Required<ResultsConfig>,
  "labels" | "requestId" | "stateKey" | "namespace"
> & {
  requestId?: string;
  stateKey?: string;
  namespace?: string;
  labels: ResultsPanelNormalizedLabels;
};

const defaultConfig = {
  pageSize: 20,
  method: "GET" as SearchRequestMethod,
  queryParam: DEFAULT_QUERY_PARAM,
  facetDepthLevel: 1,
  facetFields: DEFAULT_FACET_FIELDS,
  facetPathSeparator: DEFAULT_FACET_PATH_SEPARATOR,
  facetFieldSize: DEFAULT_FACET_FIELD_SIZE,
  debugMode: false,
  renderers: {
    loader: renderDefaultLoader,
    error: renderResultsPanelError,
  },
  labels: {
    paginationInfo: (currentPage: number, pageNumber: number) =>
      `Page ${currentPage} of ${pageNumber}`,
    totalResults: (totalCount: number) => `${totalCount} results found`,
    ariaPaginationGoToPage: (pageNumber: number) => `Go to page ${pageNumber}`,
    ariaPaginationNavigation: "Pagination",
    sortBy: "Sort by:",
    defaultSortOption: "Relevance",
  },
  sortFields: ["date"],
  sortParam: DEFAULT_SORT_PARAM,
} as const satisfies Omit<ResultsConfig, "dataSources">;

export const resolveConfig = (
  resultsConfig: Results | ResultsConfig,
): Results => {
  const defaultLabels = normalizeLabels(defaultConfig.labels);
  const configLabels = resultsConfig.labels
    ? normalizeLabels(resultsConfig.labels)
    : {};
  // Spreading an explicitly-undefined override would drop the default - e.g.
  // `queryParam: undefined` would make the panel read a param named "undefined".
  const overrides = Object.fromEntries(
    Object.entries(resultsConfig).filter(([, value]) => value !== undefined),
  ) as Partial<ResultsConfig>;

  return {
    ...defaultConfig,
    ...overrides,
    dataSources: resultsConfig.dataSources,
    renderers: {
      ...defaultConfig.renderers,
      ...resultsConfig.renderers,
    },
    labels: {
      ...defaultLabels,
      ...Object.fromEntries(
        Object.entries(configLabels).filter(([, value]) => value !== undefined),
      ),
    },
  };
};
