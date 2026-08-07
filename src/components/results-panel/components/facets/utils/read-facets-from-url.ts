/** Restores a facet selection from the URL - the deep-link/share entry point. */
export const readFacetsFromUrl = (
  paramName: string,
): Map<string, Set<string>> => {
  const raw = new URLSearchParams(window.location.search).get(paramName);
  const selected = new Map<string, Set<string>>();

  if (!raw) {
    return selected;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    Object.entries(parsed).forEach(([field, values]) => {
      if (Array.isArray(values)) {
        const paths = values.filter(
          (value): value is string => typeof value === "string",
        );

        if (paths.length > 0) {
          selected.set(field, new Set(paths));
        }
      }
    });
  } catch (error) {
    console.error("Could not parse facet selection from the URL", error);
  }

  return selected;
};
