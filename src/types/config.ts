import type { QueryInput, QueryInputLabels, QueryInputRenderers } from './query-input';

export type AnalyticsEvents =
  | {
      type: 'streamx_modal_search_open';
    }
  | {
      type: 'streamx_modal_search_close';
    }
  | {
      type: 'streamx_modal_search_input_change';
      data: {
        input: string;
      };
    };

export interface QueryInputConfig {
  minSearchLength?: number;
  searchApiUrl: string | (() => string);
  searchPageUrl?: (val: string) => string;
  groupByCategory?: boolean;
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
