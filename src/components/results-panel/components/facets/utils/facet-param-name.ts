import type { Results } from "../../../config/results-panel-config.ts";

const DEFAULT_FACETS_PARAM = "stx-facets";

/**
 * URL param the panel persists its facet selection under. Suffixed with the
 * panel's `stateKey` (the tab id inside search tabs) so sibling panels keep
 * separate selections in one URL.
 */
export const facetsParamName = (results: Results) =>
  results.stateKey
    ? `${DEFAULT_FACETS_PARAM}-${results.stateKey}`
    : DEFAULT_FACETS_PARAM;
