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
   * Submit by writing `queryParam` to the current URL instead of navigating to
   * `searchPageUrl` - used when a results panel sits next to the input.
   */
  submitInPlace?: boolean;
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
