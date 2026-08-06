import { dispatchUrlChangeEvent, html} from "../../helper";

type SortDirection = 'asc' | 'desc';
// Sorting should contain field name which is used for sorting and the sort direction
type SortBy = `${string}__${SortDirection}`;

export interface SortItem {
    label: string;
    sortBy: SortBy | null;
}

const updateSortOption = (sortParam: string, sortOption: string) => {
    const url = new URL(window.location.href);

    url.searchParams.delete(sortParam);
    if (sortOption) {
        url.searchParams.set(sortParam, sortOption);
    }
    window.history.pushState({}, "", url);
    dispatchUrlChangeEvent();
};

export const createSortOptions = (sortParam: string, label: string, options: SortItem[] | null) => {
    if (!options?.length) return null;

    const selectId = crypto.randomUUID();

    const sortOptionElements: HTMLElement[] = options.map((option: SortItem) => html`
        <option value="${option.sortBy ?? ''}">${option.label}</option>
    ` as HTMLOptionElement);

    const sortOptionsEl = html`
        <div class="stx-results-panel__sort-options-container">
            <label for="${selectId}">${label}</label>
            <select class="stx-results-panel__sort-options" id="${selectId}">
                ${sortOptionElements}
            </select>
        </div>
    ` as HTMLDivElement;

    const sortOptionsSelect = sortOptionsEl.querySelector('.stx-results-panel__sort-options') as HTMLSelectElement;

    sortOptionsSelect.addEventListener('change', e => {
        const target = e.target as HTMLSelectElement;
        updateSortOption(sortParam, target.value);
    });

    return { element: sortOptionsEl, selectElement: sortOptionsSelect };
};