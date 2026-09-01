/**
 * Root entry point.
 *
 * Re-exports every public factory and type, so a consumer can reach the whole
 * library from the package name alone:
 *
 * ```ts
 * import { createResultsPanel } from "@streamx-hub/search";
 * ```
 *
 * The per-feature entries (`@streamx-hub/search/search-inline` and friends)
 * stay available and pull in less code, so prefer them when only one component
 * is used.
 */

export { createSearchInput, mountSearchModal } from "./search-inline";
export { createResultsPanel } from "./search-results-panel";
export { createSearchTabs } from "./search-tabs";
export { getHitUrl } from "../renderers/renderers";

export type * from "../types/public";
