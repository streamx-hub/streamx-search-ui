import {
  debounce,
  fetchSearchResults,
  html,
  dispatchUrlChangeEvent,
} from "../../helper";
import defaultConfig from "../../inline-search/default-config";
import createSuggestions from "../suggestions/suggestions";
import type { QueryInputConfig } from "../../types/config";
import type { QueryInput } from "../../types/query-input";
import type { OpenSearchResponse } from "../../types/open-search";
import "./query-input.css";

const resolveConfig = (customConfig: QueryInputConfig): QueryInput => {
  const inputOption: QueryInput = {
    ...defaultConfig.input,
    ...customConfig,
    renderers: {
      ...defaultConfig.input.renderers,
      ...customConfig.renderers,
    },
    labels: { ...defaultConfig.input.labels, ...customConfig.labels },
  };

  return inputOption;
};

const createDebouncedSearch = (
  url: string,
  callback: (data: OpenSearchResponse) => void,
) => {
  let controller: AbortController | null = null;

  const deboucendSearch = debounce(async (query) => {
    controller?.abort();

    controller = new AbortController();

    try {
      const data = await fetchSearchResults(url, query, controller.signal);

      callback(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error(error);
    }
  }, 300);

  return deboucendSearch;
};

const updateSearchQuery = (query: string) => {
  const url = new URL(window.location.href);
  const SEARCH_QUERY_PARAM_NAME = "stx-search";

  url.searchParams.delete(SEARCH_QUERY_PARAM_NAME);
  url.searchParams.set(SEARCH_QUERY_PARAM_NAME, query);
  window.history.pushState({}, "", url);
  dispatchUrlChangeEvent();
};

export function createQueryInput(customConfig: QueryInputConfig) {
  const config = resolveConfig(customConfig);
  const inputTextId = crypto.randomUUID();
  const suggestionWrapperId = crypto.randomUUID();
  const { labels, renderers } = config;
  let onSearch: (val: string) => void;

  const queryInputEl = html`
    <div class="stx-query-input">
      <div class="stx-query-input__controls">
        <div class="stx-query-input__input-wrapper">
          <label for="${inputTextId}">${labels.inputLabel}</label>
          <input
            class="stx-query-input__input"
            type="text"
            placeholder="${labels.inputPlaceholder}"
            role="combobox"
            aria-expanded="false"
            aria-autocomplete="list"
            aria-controls="${suggestionWrapperId}"
            id="${inputTextId}"
          />
          <button
            class="stx-query-input__clear-button stx-hidden"
            type="button"
            aria-label="${labels.clearButtonAria}"
          >
            ${renderers.clearIcon()}
          </button>
        </div>
        <button
          class="stx-query-input__search-button"
          type="button"
          aria-label="${labels.searchButtonAria}"
        >
          ${renderers.searchIcon()}
        </button>
      </div>
      <div
        class="stx-query-input__suggestions-wrapper"
        id="${suggestionWrapperId}"
      ></div>
    </div>
  ` as HTMLDivElement;

  const inputEl = queryInputEl.querySelector(
    ".stx-query-input__input",
  ) as HTMLInputElement;

  const suggestionContainer = queryInputEl.querySelector(
    ".stx-query-input__suggestions-wrapper",
  );

  const clearButton = queryInputEl.querySelector(
    ".stx-query-input__clear-button",
  ) as HTMLButtonElement;

  const searchButton = queryInputEl.querySelector(
    ".stx-query-input__search-button",
  ) as HTMLButtonElement;

  let activeIndex = -1;
  let suggestionListLenght = 0;

  const updateActiveItem = () => {
    if (!suggestionContainer) {
      return;
    }

    const elements = suggestionContainer.querySelectorAll(
      ".stx-suggestion__item",
    ) as NodeListOf<HTMLElement>;

    elements.forEach((el, index) => {
      if (index === activeIndex) {
        el.classList.add("is-active");
        el.setAttribute("aria-selected", "true");
        el.scrollIntoView({ block: "nearest" });
        el.setAttribute("tabindex", "0");
        inputEl.setAttribute("aria-activedescendant", el.id);
      } else {
        el.classList.remove("is-active");
        el.setAttribute("aria-selected", "false");
        el.setAttribute("tabindex", "-1");
      }
    });

    if (activeIndex === -1) {
      inputEl.removeAttribute("aria-activedescendant");
    }
  };

  if (inputEl) {
    let url = "";

    if (typeof config.searchApiUrl === "string") {
      url = config.searchApiUrl;
    } else {
      url = config.searchApiUrl();
    }

    onSearch = createDebouncedSearch(url, (results) => {
      const suggestionEl = createSuggestions(results, config);
      suggestionListLenght = results.hits.hits?.length || 0;
      activeIndex = -1;

      if (suggestionContainer) {
        suggestionContainer.innerHTML = "";
        suggestionContainer.append(suggestionEl.element as Element);
      }
    });

    inputEl.addEventListener("input", async (event) => {
      const { value } = event.target as HTMLInputElement;

      clearButton.classList.toggle("stx-hidden", !value.length);

      if (value.length >= config.minSearchLength) {
        onSearch(inputEl.value);
      }

      if (!value.length && suggestionContainer) {
        suggestionContainer.innerHTML = "";
        suggestionListLenght = 0;
      }
    });

    inputEl.addEventListener("keydown", (e) => {
      const { key } = e;

      if (key === "Enter") {
        if (activeIndex > -1 && suggestionContainer) {
          e.preventDefault();
          const elements = suggestionContainer.querySelectorAll(
            ".stx-suggestion__item",
          ) as NodeListOf<HTMLElement>;

          elements[activeIndex]?.click();
        } else {
          if (config.searchPageUrl) {
            const link = config.searchPageUrl(inputEl.value);

            window.location.href = link.toString();
          } else {
            updateSearchQuery(inputEl.value);
          }
        }
      }

      if (!suggestionListLenght) {
        return;
      }

      const maxIndex = suggestionListLenght;

      if (key === "ArrowDown") {
        e.preventDefault();

        if (maxIndex === 0) return;

        activeIndex = activeIndex < maxIndex ? activeIndex + 1 : 0;
        updateActiveItem();
      } else if (key === "ArrowUp") {
        e.preventDefault();

        if (maxIndex === 0) return;

        activeIndex = activeIndex > 0 ? activeIndex - 1 : maxIndex;
        updateActiveItem();
      } else if (key === "Escape") {
        activeIndex = -1;

        if (suggestionContainer) {
          suggestionContainer.innerHTML = "";
        }
      }
    });
  }

  if (clearButton && inputEl && suggestionContainer) {
    clearButton.addEventListener("click", () => {
      inputEl.value = "";
      suggestionContainer.innerHTML = "";
      suggestionListLenght = 0;
      inputEl.focus();
    });
  }

  if (searchButton && config.searchPageUrl) {
    const { searchPageUrl } = config;

    searchButton.addEventListener("click", () => {
      const link = searchPageUrl(inputEl.value);

      window.location.href = link.toString();
    });
  } else {
    if (searchButton) {
      searchButton.remove();
    }
  }

  window.addEventListener("click", (e) => {
    const target = e.target as Element;

    if (target !== queryInputEl && !target.closest(".stx-query-input")) {
      activeIndex = -1;

      if (suggestionContainer) {
        suggestionContainer.innerHTML = "";
      }
    }
  });

  return { element: queryInputEl, inputEl: inputEl };
}
