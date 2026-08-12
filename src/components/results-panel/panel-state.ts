/** Per-panel mutable state, kept off the element itself. */
export interface PanelState {
    currentPage: number;
    /**
     * Selected facet values, keyed by the facet **tree** (the top-level
     * aggregation field) they were selected under, so every selection inside one
     * tree ends up OR-ed in a single filter entry.
     */
    selectedFilters: Map<string, Set<string>>;
    facetsElement: HTMLElement | null;
    resultsContainer: HTMLElement | null;
    /** In-flight results request, aborted when a newer one supersedes it. */
    request: AbortController | null;
}

export const panelStates = new WeakMap<HTMLElement, PanelState>();