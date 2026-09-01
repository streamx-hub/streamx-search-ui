import type {
  ResultsConfig,
  ResultsPanelLabels,
} from "./components/results-panel/config/results-panel-config";
import { DEFAULT_QUERY_PARAM, DEFAULT_SORT_PARAM } from "./config";
import { html } from "./helper";
import type { QueryInputConfig } from "./types/config.ts";

/**
 * Resolves the library stylesheet from the location of the calling module.
 *
 * The decorators ship one directory below the stylesheet (`eds/*.js` next to
 * `streamx-search.css`), so the same relative hop is correct wherever the
 * built files were put - vendored into `scripts/search/`, served from another
 * folder, or fetched from a CDN. Hardcoding an absolute path instead tied the
 * decorators to one deployment layout and broke silently in every other.
 *
 * Pass `import.meta.url` from the decorator module.
 */
export const resolveStylesheetHref = (moduleUrl: string) =>
  new URL("../streamx-search.css", moduleUrl).href;

export const loadCssFile = (cssFile: string) => {
  // A page can hold several decorated blocks, and each one loading its own
  // stylesheet would append a duplicate <link> per block. `link.href` is the
  // resolved absolute URL, which is what `resolveStylesheetHref` returns too.
  const alreadyLoaded = [
    ...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  ].some((link) => link.href === cssFile);

  if (alreadyLoaded) {
    return;
  }

  const styleEl = document.createElement("link");

  styleEl.setAttribute("href", cssFile);
  styleEl.setAttribute("rel", "stylesheet");
  document.head.append(styleEl);
};

export const renderEDSLabelTemplate = (
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

export type EDSPanelLabels = {
  paginationInfo?: string;
  totalResults?: string;
  ariaPaginationGoToPage?: string;
  ariaPaginationNavigation?: string;
  sortBy?: string;
  defaultSortOption?: string;
};

/**
 * Results-panel options authorable as EDS block rows. Shared by the Results
 * Panel and Search Tabs decorators so their option sets cannot drift apart.
 */
export type EDSPanelOptions = EDSPanelLabels & {
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
  /** URL param carrying the sort option */
  sortParam?: string;
  /**
   * Comma-separated sort fields which will be available to sort both in ascending and descending direction - e.g.
   * `publication_date, title`.
   */
  sortFields?: string;
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

export const generatePanelLabels = (
  config: EDSPanelLabels,
): Partial<ResultsPanelLabels> => {
  const labels: Partial<ResultsPanelLabels> = {};

  if (config.paginationInfo) {
    labels.paginationInfo = (currentPage: number, pageNumber: number) =>
      renderEDSLabelTemplate(config.paginationInfo, {
        currentPage,
        pageNumber,
      });
  }

  if (config.totalResults) {
    labels.totalResults = (totalCount: number) =>
      renderEDSLabelTemplate(config.totalResults, {
        totalCount,
      });
  }

  if (config.ariaPaginationGoToPage) {
    labels.ariaPaginationGoToPage = (pageNumber: number) =>
      renderEDSLabelTemplate(config.ariaPaginationGoToPage, {
        pageNumber,
      });
  }

  if (config.ariaPaginationNavigation) {
    labels.ariaPaginationNavigation = config.ariaPaginationNavigation;
  }

  if (config.sortBy) {
    labels.sortBy = config.sortBy;
  }

  if (config.defaultSortOption) {
    labels.defaultSortOption = config.defaultSortOption;
  }

  return labels;
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
export const readPanelOptions = (
  config: Partial<EDSPanelOptions>,
): ResultsConfig => ({
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
  labels: generatePanelLabels(config),
  sortParam: config.sortParam || DEFAULT_SORT_PARAM,
  sortFields: parseFacetFields(config.sortFields),
});

/**
 * Maps authored EDS rows to a query-input config. Single source of truth, so
 * both search blocks expose the same input options.
 *
 * `searchApiUrl` is deliberately left to the caller: the decorators validate it
 * first, and that check is what narrows it to a non-empty string.
 */
export const readInputOptions = (
  config: Partial<EDSInputOptions>,
): Omit<QueryInputConfig, "searchApiUrl"> => {
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
