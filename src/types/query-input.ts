import type { OpenSearchItem } from "./open-search";

export interface QueryInputLabels {
  inputPlaceholder: string;
  inputLabel: string;
  clearButtonAria: string;
  searchButtonAria: string;
}

/**
 * Root element returned by `createQueryInput`, carrying a handle to reopen the
 * `initialQuery` dropdown.
 *
 * Needed when something other than the input itself opens the search (e.g. a
 * nav toggle): focus alone is not a reliable trigger, because `.focus()` emits
 * no event when the element is already focused.
 */
export interface QueryInputElement extends HTMLDivElement {
  /**
   * Shows the `initialQuery` results, if one is configured and the input is
   * empty. No-op otherwise.
   */
  showInitialSuggestions: () => void;
}

export interface QueryInputRenderers {
  suggestionItem: (suggestionItem: OpenSearchItem) => Element | undefined;
  groupItem: (groupItem: OpenSearchItem) => Element | undefined;
  clearIcon: () => HTMLElement | string;
  searchIcon: () => HTMLElement | string;
}

export type QueryInput = {
  minSearchLength: number;
  searchApiUrl: string | (() => string);
  searchPageUrl?: (val: string) => string;
  groupByCategory: boolean;
  /** URL param carrying the active query. Shared with the results panel. */
  queryParam: string;
  /**
   * Query pre-fetched on render and offered in the dropdown while the input is
   * focused and empty. Omit to disable.
   */
  initialQuery?: string;
  /** Restricts suggestions to one content namespace. */
  namespace?: string;
  /**
   * Submit by writing `queryParam` to the current URL instead of navigating to
   * `searchPageUrl` - used when a results panel sits next to the input.
   */
  submitInPlace?: boolean;
  /** Renders the built-in search (submit) button. */
  showSearchButton: boolean;
  /**
   * Lets a suggestion item act as a plain navigation link instead of
   * submitting its text as the query.
   */
  suggestionsAsLinks?: boolean;
  /**
   * Computes the query submitted when a suggestion item is picked, in place
   * of the default (the item's trimmed text content). No effect when
   * `suggestionsAsLinks` is set, since suggestions then act as links instead
   * of submitting a query.
   */
  suggestionItemSubmitValue?: (suggestionItem: Element) => string;
  labels: QueryInputLabels;
  renderers: QueryInputRenderers;
};
