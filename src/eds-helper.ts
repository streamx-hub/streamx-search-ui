import type { ResultsPanelLabels } from "./components/results-panel/results-panel";
import { DEFAULT_QUERY_PARAM } from "./config";
import { html } from "./helper";

export const loadCssFile = (cssFile: string) => {
  const styleEl = document.createElement("link");

  styleEl.setAttribute("href", cssFile);
  styleEl.setAttribute("rel", "stylesheet");
  document.head.append(styleEl);
};

export const renderEDSLableTemplate = (
  template: string | undefined,
  values: Record<string, string | number>,
) => {
  if (!template) return "";

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
};

export const getEDSConfig = <
  TConfig extends Record<string, string | undefined>,
>(
  block: HTMLElement,
): Partial<TConfig> => {
  const rows = [...block.querySelectorAll(":scope > div")];
  const config: Partial<TConfig> = {};

  rows.forEach((row, index) => {
    try {
      const [keyEl, valueEl] = row.querySelectorAll(":scope > div");

      const key = keyEl?.textContent?.trim() as keyof TConfig;
      const value = valueEl?.textContent?.trim();

      if (key && value !== undefined) {
        config[key] = value as TConfig[typeof key];
      }
    } catch (error) {
      console.error(
        `There are some problems with building EDS config. Row number: ${index + 1}`,
        error,
        block,
      );
    }
  });

  return config;
};

export const replaceElWithError = (root: HTMLElement, error: string) => {
  const errorEl = html`
    <div
      style="
        color: red;
        padding: 10px;
        border: solid 2px red;
        background: rgba(255, 0, 0, 0.2)
      "
    >
      ${error}
    </div>
  ` as HTMLElement;

  root.append(errorEl);
};

export type EDSPannelLabels = {
  paginationInfo?: string;
  totalResults?: string;
  ariaPaginationGoToPage?: string;
  ariaPaginationNavigation?: string;
};

/**
 * Results-panel options authorable as EDS block rows. Shared by the Results
 * Panel and Search Tabs decorators so their option sets cannot drift apart.
 */
export type EDSPanelOptions = EDSPannelLabels & {
  pageSize?: string;
  dataSources?: string;
  /** Saved query/template id sent as the request body `id`. */
  requestId?: string;
  /** How deep the facet aggregations nest. Defaults to a single flat level. */
  facetDepthLevel?: string;
  /**
   * Comma-separated facet roots to request, one tree each - e.g.
   * `category, tags, content_type`. Level and filter field names are derived
   * from each root, so no other facet field option is needed.
   */
  facetFields?: string;
  /** Separator between the levels of a hierarchical facet path. */
  facetPathSeparator?: string;
  /** Maximum number of values requested per facet field. */
  facetFieldSize?: string;
  /** `"true"` renders debug diagnostics in the results list; anything else is off. */
  debugMode?: string;
  /** Restricts results to one content namespace. Omit to search all of them. */
  namespace?: string;
};

/**
 * Search-input options authorable as EDS block rows. Shared by the Results
 * Panel and Search Tabs decorators so their option sets cannot drift apart -
 * the input half of {@link EDSPanelOptions}.
 */
export type EDSInputOptions = {
  searchPageUrl?: string;
  minSearchLength?: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  clearButtonAria?: string;
  searchButtonAria?: string;
  /** URL param carrying the query. Shared by the input and the panel(s). */
  queryParam?: string;
  /** Query pre-fetched on render and offered while the input is empty. */
  initialQuery?: string;
  /** Restricts suggestions to one content namespace. Omit to search all. */
  namespace?: string;
};

/**
 * Layers two EDS configs: `override` wins key by key, but empty values fall
 * through to `base`, so an empty cell in a tab block cannot blank out a
 * block-level default.
 */
export const mergeEDSConfigs = <
  TConfig extends Record<string, string | undefined>,
>(
  base: Partial<TConfig>,
  override: Partial<Record<string, string | undefined>>,
): Partial<TConfig> => ({
  ...base,
  ...(Object.fromEntries(
    Object.entries(override).filter(([, value]) => value),
  ) as Partial<TConfig>),
});

export const generatePannelLabels = (config: EDSPannelLabels) => {
  const lables: Partial<ResultsPanelLabels> = {};

  if (config.paginationInfo) {
    lables.paginationInfo = (currentPage: number, pageNumber: number) =>
      renderEDSLableTemplate(config.paginationInfo, {
        currentPage,
        pageNumber,
      });
  }

  if (config.totalResults) {
    lables.totalResults = (totalCount: number) =>
      renderEDSLableTemplate(config.totalResults, {
        totalCount,
      });
  }

  if (config.ariaPaginationGoToPage) {
    lables.ariaPaginationGoToPage = (pageNumber: number) =>
      renderEDSLableTemplate(config.ariaPaginationGoToPage, {
        pageNumber,
      });
  }

  if (config.ariaPaginationNavigation) {
    lables.ariaPaginationNavigation = config.ariaPaginationNavigation;
  }

  return lables;
};

/**
 * Parses the authored `facetFields` row - a comma-separated list of facet roots
 * - into the array the panel expects. Blank entries are dropped, and an empty
 * row falls back to the component default.
 */
const parseFacetFields = (value: string | undefined) => {
  const roots = (value ?? "")
    .split(",")
    .map((root) => root.trim())
    .filter(Boolean);

  return roots.length > 0 ? roots : undefined;
};

/** Maps authored EDS rows to a results-panel config. Single source of truth. */
export const readPanelOptions = (config: Partial<EDSPanelOptions>) => ({
  pageSize: Number(config.pageSize) || 10,
  dataSources: config.dataSources ? [config.dataSources] : [],
  // Facets and filtering travel in the request body, so results use POST.
  method: "POST" as const,
  requestId: config.requestId || undefined,
  facetDepthLevel: Number(config.facetDepthLevel) || undefined,
  facetFields: parseFacetFields(config.facetFields),
  facetPathSeparator: config.facetPathSeparator || undefined,
  facetFieldSize: Number(config.facetFieldSize) || undefined,
  debugMode:
    config.debugMode === undefined
      ? undefined
      : config.debugMode.trim().toLowerCase() === "true",
  namespace: config.namespace || undefined,
  labels: generatePannelLabels(config),
});

/**
 * Maps authored EDS rows to a query-input config. Single source of truth, so
 * both search blocks expose the same input options.
 *
 * `searchApiUrl` is deliberately left to the caller: the decorators validate it
 * first, and that check is what narrows it to a non-empty string.
 */
export const readInputOptions = (config: Partial<EDSInputOptions>) => {
  // The input writes this param and the panel(s) read it, so both get the same.
  const queryParam = config.queryParam || DEFAULT_QUERY_PARAM;
  const searchPageUrl = config.searchPageUrl;

  return {
    queryParam,
    searchPageUrl: searchPageUrl
      ? (query: string) =>
          `${searchPageUrl}?${queryParam}=${encodeURIComponent(query)}`
      : undefined,
    minSearchLength: Number(config.minSearchLength) || 3,
    initialQuery: config.initialQuery || undefined,
    namespace: config.namespace || undefined,
    // The results sit right below the input, so submitting refreshes them in
    // place - unless the block points at a dedicated search page, which wins.
    submitInPlace: !searchPageUrl,
    labels: {
      inputPlaceholder: config.inputPlaceholder,
      inputLabel: config.inputLabel,
      clearButtonAria: config.clearButtonAria,
      searchButtonAria: config.searchButtonAria,
    },
  };
};
