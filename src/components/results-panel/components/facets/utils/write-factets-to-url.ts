import { serializeFilters } from "../../../utils/serialize-filters.ts";

/**
 * Mirrors the current facet selection into the URL via `replaceState` (no
 * history entry per click), removing the param entirely when nothing is
 * selected so a shared link stays clean.
 */
export const writeFacetsToUrl = (
  paramName: string,
  selectedFilters: Map<string, Set<string>>,
) => {
  const url = new URL(window.location.href);
  const serialized = serializeFilters(selectedFilters);

  if (Object.keys(serialized).length > 0) {
    url.searchParams.set(paramName, JSON.stringify(serialized));
  } else {
    url.searchParams.delete(paramName);
  }

  window.history.replaceState({}, "", url);
};
