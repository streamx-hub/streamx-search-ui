import type { OpenSearchItem } from "./open-search";

export interface QueryInputLabels {
  inputPlaceholder: string;
  inputLabel: string;
  clearButtonAria: string;
  searchButtonAria: string;
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
  labels: QueryInputLabels;
  renderers: QueryInputRenderers;
};
