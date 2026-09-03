import type {
  QueryInput,
  QueryInputLabels,
  QueryInputRenderers,
} from "./query-input";

export type AnalyticsEvents =
  | {
      type: "streamx_modal_search_open";
    }
  | {
      type: "streamx_modal_search_close";
    }
  | {
      type: "streamx_modal_search_input_change";
      data: {
        input: string;
      };
    };

export interface QueryInputConfig {
  minSearchLength?: number;
  searchApiUrl: string | (() => string);
  searchPageUrl?: (val: string) => string;
  groupByCategory?: boolean;
  /**
   * URL param carrying the active query. Must match the results panel's
   * `queryParam`. Defaults to {@link DEFAULT_QUERY_PARAM}.
   */
  queryParam?: string;
  /**
   * Query pre-fetched on render and offered in the dropdown while the input is
   * focused and empty. Omit to disable.
   */
  initialQuery?: string;
  /**
   * Restricts suggestions to one content namespace, sent as a `namespace` query
   * param. Omit to search across all namespaces.
   */
  namespace?: string;
  /**
   * Submit by writing `queryParam` to the current URL instead of navigating to
   * `searchPageUrl` - used when a results panel sits next to the input.
   */
  submitInPlace?: boolean;
  /**
   * Renders the built-in search (submit) button. Defaults to `true`, in which
   * case the button is still dropped when the input has nowhere to submit.
   *
   * Set to `false` when the surrounding markup already provides its own submit
   * affordance - e.g. a nav search behind its own magnifier toggle - so the
   * button is never rendered rather than hidden with CSS.
   */
  showSearchButton?: boolean;
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
  labels?: Partial<QueryInputLabels>;
  renderers?: Partial<QueryInputRenderers>;
}

export interface ModalConfig {
  searchOpenElementSelector: string;
  searchCloseElementSelector?: string;
  useNonModal?: boolean;
  analytics?: (event: AnalyticsEvents) => void;
  input: QueryInputConfig;
}

export interface Modal {
  searchOpenElementSelector: string;
  searchCloseElementSelector?: string;
  useNonModal: boolean;
  analytics: (event: AnalyticsEvents) => void;
  input: QueryInput;
}
