export const serializeFilters = (selectedFilters: Map<string, Set<string>>) =>
  Object.fromEntries(
    [...selectedFilters.entries()].map(([field, values]) => [
      field,
      [...values],
    ]),
  );
