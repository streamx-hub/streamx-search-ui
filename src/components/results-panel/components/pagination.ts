import { html } from "../../../helper";
import type { OpenSearchResponse } from "../../../types/open-search";
import type { Results } from "../config/results-panel-config";

const createPagination = (
  data: OpenSearchResponse,
  results: Results,
  currentPage: number,
) => {
  const totalNumber = data.hits.total.value;
  const { pageSize } = results;
  const pagesCount = Math.ceil(totalNumber / pageSize);
  const paginationButtonList: HTMLElement[] = [];
  let paginationStartPage = currentPage - 2;

  if (pagesCount <= 1) {
    return "";
  }

  if (currentPage <= 3) {
    paginationStartPage = 1;
  } else if (currentPage >= pagesCount - 2) {
    paginationStartPage = pagesCount - 4;
  }

  if (paginationStartPage > 1) {
    paginationButtonList.push(
      html`<li class="stx-results-panel__pagination-list-item">
        <button data-page-number="1" aria-label="${results.labels.ariaPaginationGoToPage(1)}">1</a>
      </li>` as HTMLLinkElement,
    );
  }

  if (paginationStartPage > 2) {
    paginationButtonList.push(
      html`<li
        class="stx-results-panel__pagination-list-item stx-results-panel__pagination-dots "
        aria-hidden="true"
      >
        ...
      </li>` as HTMLSpanElement,
    );
  }

  const paginationEndIndex =
    pagesCount < 5 ? pagesCount + 1 : paginationStartPage + 5;

  for (let i = paginationStartPage; i < paginationEndIndex; i++) {
    paginationButtonList.push(
      html`<li class="stx-results-panel__pagination-list-item">
        <button
          data-page-number="${i}"
          class="${currentPage === i ? "stx-is-active" : ""}"
          aria-current="${currentPage === i ? "page" : null}"
          aria-label="${results.labels.ariaPaginationGoToPage(i)}"
        >
          ${i}
        </button>
      </li>` as HTMLLinkElement,
    );
  }

  if (paginationStartPage < pagesCount - 5) {
    paginationButtonList.push(
      html`<li
        class="stx-results-panel__pagination-list-item stx-results-panel__pagination-dots"
        aria-hidden="true"
      >
        ...
      </li>` as HTMLSpanElement,
    );
  }

  if (paginationStartPage < pagesCount - 4) {
    paginationButtonList.push(
      html` <li class="stx-results-panel__pagination-list-item">
        <button
          data-page-number="${pagesCount}"
          aria-label="${results.labels.ariaPaginationGoToPage(pagesCount)}"
        >
          ${pagesCount}
        </button>
      </li>` as HTMLLinkElement,
    );
  }

  return html`
    <nav
      aria-label="${results.labels.ariaPaginationNavigation()}"
      class="stx-results-panel__pagination-container"
    >
      <ul class="stx-results-panel__pagination-list">
        ${paginationButtonList}
      </ul>
    </nav>
  ` as HTMLDivElement;
};

export default createPagination;
