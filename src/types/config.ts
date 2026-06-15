import type { OpenSearchItem } from './results';

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

export interface ModalLabels {
  inputPlaceholder?: string;
  inputLabel?: string;
  clearButtonAria?: string;
  searchButtonAria?: string;
}

export interface ModalConfig {
  searchApiUrl: string | (() => string);
  searchPageUrl?: (val: string) => string;
  searchOpenElementSelector: string;
  searchCloseElementSelector?: string;
  minSearchLength?: number;
  groupByCategory?: boolean;
  useNonModal?: boolean;
  analytics?: (event: AnalyticsEvents) => void;
  renderers?: {
    suggestionItem?: (suggestionItem: OpenSearchItem) => Element | undefined;
    groupItem?: (groupItem: OpenSearchItem) => Element | undefined;
    clearIcon?: () => HTMLElement | string;
    searchIcon?: () => HTMLElement | string;
  };
  labels?: ModalLabels;
}

export interface InternalModalConfig extends Required<
  Omit<
    ModalConfig,
    'analytics' | 'renderers' | 'searchCloseElementSelector' | 'searchPageUrl'
  >
> {
  analytics?: ModalConfig['analytics'];
  searchCloseElementSelector?: ModalConfig['searchCloseElementSelector'];
  searchPageUrl?: ModalConfig['searchPageUrl'];
  renderers: Required<NonNullable<ModalConfig['renderers']>>;
  labels: Required<NonNullable<ModalConfig['labels']>>;
}
