/**
 * The library's public type surface.
 *
 * Every entry point re-exports this module, so a consumer can import a type
 * from whichever path they imported the factory from. Types that are not
 * listed here are internal and may change without a major version.
 */

export type { AnalyticsEvents, ModalConfig, QueryInputConfig } from "./config";

export type {
  QueryInputElement,
  QueryInputLabels,
  QueryInputRenderers,
} from "./query-input";

export type {
  OpenSearchAggregation,
  OpenSearchAggregationBucket,
  OpenSearchItem,
  OpenSearchItemSourcePayload,
  OpenSearchResponse,
  SearchRequestMethod,
} from "./open-search";

export type {
  ResultsConfig,
  ResultsPanelLabelsConfig,
  ResultsPanelRenderers,
} from "../components/results-panel/config/results-panel-config";

export type { TabConfig } from "../components/tabs/tabs";
