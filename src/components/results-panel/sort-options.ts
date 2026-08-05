import { html } from "../../helper";

type SortDirection = 'asc' | 'desc';
// Sorting should contain field name which is used for sorting and the sort direction
type SortBy = `${string}__${SortDirection}`;

export interface SortItem {
    label: string;
    sortBy: SortBy;
}

export const createSortOptions = (label: string, options: SortItem[] | null) => {
    if (!options?.length) return '';

    const selectId = crypto.randomUUID();

    const sortOptionElements: HTMLElement[] = options.map((option: SortItem) => html`
        <option value="${option.sortBy}">${option.label}</option>
    ` as HTMLOptionElement);

    return html`
        <div class="stx-results-panel__sort-options-container">
            <label for="${selectId}">${label}</label>
            <select class="stx-results-panel__sort-options" id="${selectId}">
                ${sortOptionElements}
            </select>
        </div>
    `;
};