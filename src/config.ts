const config = {
  debug: false,
};

/**
 * Default URL param carrying the active search query.
 *
 * The query input writes it and the results panel reads it, so both sides must
 * agree. Override per component with the `queryParam` option.
 */
export const DEFAULT_QUERY_PARAM = "query";

/**
 * URL param holding the active tab's id.
 *
 * It is written only while a non-default tab is selected, so the URL stays
 * clean on the first tab.
 */
export const ACTIVE_TAB_PARAM = "stx-tab";

/**
 * Default URL param carrying sort field and direction.
 *
 * It is set by sort options select.
 * It is written only while a non-default sort is selected.
 */
export const DEFAULT_SORT_PARAM = "sort-by";

export default config;
