import { dispatchUrlChangeEvent, html } from "../../helper";

export const SORT_BY_SEPARATOR = "__";

/** Turns sort field name into a heading, e.g. `publication_date` → `Publication Date`. */
const humanizeSortFieldLabel = (field: string) =>
  field.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ||
  field;

const writeSortOptionToUrl = (sortParam: string, sortOption: string) => {
  const url = new URL(window.location.href);

  url.searchParams.delete(sortParam);
  if (sortOption) {
    url.searchParams.set(sortParam, sortOption);
  }
  window.history.pushState({}, "", url);
  dispatchUrlChangeEvent();
};

/**
 * We cannot easily pass full labels to EDS blocks (as we are passing just field names)
 * so we need to estbalish typical direction labels manually
 */
function getSortDirectionLabels(sortFieldName: string): {
  ascLabel: string;
  descLabel: string;
} {
  if (sortFieldName.includes("date")) {
    return {
      descLabel: "(Newest)",
      ascLabel: "(Oldest)",
    };
  }

  return {
    ascLabel: "(Ascending)",
    descLabel: "(Descending)",
  };
}

export const createSortOptions = (
  sortParam: string,
  label: string,
  sortFields: string[] | null,
  defaultSortOptionLabel: string,
) => {
  if (!sortFields?.length) return null;

  const selectId = crypto.randomUUID();

  const sortOptionElements: HTMLElement[] = [];
  sortFields.forEach((field) => {
    const fieldLabel = humanizeSortFieldLabel(field);
    const { ascLabel, descLabel } = getSortDirectionLabels(field);

    sortOptionElements.push(
      html`
        <option value="${field}${SORT_BY_SEPARATOR}asc">
          ${fieldLabel} ${ascLabel}
        </option>
      ` as HTMLOptionElement,
    );
    sortOptionElements.push(
      html`
        <option value="${field}${SORT_BY_SEPARATOR}desc">
          ${fieldLabel} ${descLabel}
        </option>
      ` as HTMLOptionElement,
    );
  });

  const sortOptionsEl = html`
    <div class="stx-results-panel__sort-options-container">
      <label for="${selectId}">${label}</label>
      <select class="stx-results-panel__sort-options" id="${selectId}">
        <option value="">${defaultSortOptionLabel}</option>
        ${sortOptionElements}
      </select>
    </div>
  ` as HTMLDivElement;

  const sortOptionsSelect = sortOptionsEl.querySelector(
    ".stx-results-panel__sort-options",
  ) as HTMLSelectElement;

  sortOptionsSelect.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    writeSortOptionToUrl(sortParam, target.value);
  });

  return { element: sortOptionsEl, selectElement: sortOptionsSelect };
};

export function updateSelectedSortOption(
  resultsPanel: HTMLElement,
  selectedSortOption: string,
) {
  const sortOptionsSelect = resultsPanel.querySelector(
    ".stx-results-panel__sort-options",
  ) as HTMLSelectElement;

  sortOptionsSelect.value = selectedSortOption;
}
