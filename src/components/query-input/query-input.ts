import {
  debounce,
  fetchSearchResults,
  html,
  dispatchUrlChangeEvent,
  withNamespaceParam,
} from "../../helper";
import defaultConfig from "../../inline-search/default-config";
import createSuggestions from "../suggestions/suggestions";
import type { QueryInputConfig } from "../../types/config";
import type { QueryInput, QueryInputElement } from "../../types/query-input";
import type { OpenSearchResponse } from "../../types/open-search";
import "./query-input.css";
import { randomUUID } from "../../utils/randomUUID";

const resolveConfig = (customConfig: QueryInputConfig): QueryInput => {
  const inputOption: QueryInput = {
    ...defaultConfig.input,
    ...customConfig,
    // Spreading an explicitly-undefined override would drop the default.
    queryParam: customConfig.queryParam || defaultConfig.input.queryParam,
    renderers: {
      ...defaultConfig.input.renderers,
      ...customConfig.renderers,
    },
    labels: {
      ...defaultConfig.input.labels,
      ...Object.fromEntries(
        Object.entries(customConfig.labels || {}).filter(
          ([, value]) => value !== undefined,
        ),
      ),
    },
  };

  return inputOption;
};

const createDebouncedSearch = (
  url: string,
  callback: (data: OpenSearchResponse) => void,
) => {
  let controller: AbortController | null = null;

  const deboucendSearch = debounce(async (query: string) => {
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

const updateSearchQuery = (query: string, queryParam: string) => {
  const url = new URL(window.location.href);

  url.searchParams.delete(queryParam);
  url.searchParams.set(queryParam, query);
  window.history.pushState({}, "", url);
  dispatchUrlChangeEvent();
};

export function createQueryInput(customConfig: QueryInputConfig) {
  const config = resolveConfig(customConfig);
  const inputTextId = randomUUID();
  const suggestionWrapperId = randomUUID();
  const { labels, renderers, queryParam } = config;

  // Every suggestion fetch goes through this URL, so the namespace is applied
  // once here rather than at each call site.
  const searchUrl = withNamespaceParam(
    typeof config.searchApiUrl === "string"
      ? config.searchApiUrl
      : config.searchApiUrl(),
    config.namespace,
  );

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
  ` as QueryInputElement;

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
  /**
   * Whether the dropdown currently holds `initialQuery` results, so typing can
   * drop them without clearing (and flickering) live typeahead results.
   */
  let showingInitialSuggestions = false;

  const closeSuggestions = () => {
    activeIndex = -1;
    suggestionListLenght = 0;
    showingInitialSuggestions = false;

    if (suggestionContainer) {
      suggestionContainer.innerHTML = "";
    }
  };

  /**
   * Submits the query. With `submitInPlace` the active query is written to the
   * URL so an adjacent results panel can react; otherwise the user is sent to
   * `searchPageUrl`.
   */
  const submitQuery = (query: string) => {
    if (config.submitInPlace) {
      updateSearchQuery(query, queryParam);
      closeSuggestions();

      return;
    }

    if (config.searchPageUrl) {
      window.location.href = config.searchPageUrl(query).toString();

      return;
    }

    updateSearchQuery(query, queryParam);
  };

  let initialSuggestionsPromise: Promise<OpenSearchResponse | null> | null =
    null;

  /** Fetches the `initialQuery` results once and caches them. */
  const prefetchInitialSuggestions = () => {
    if (!config.initialQuery) {
      return null;
    }

    if (!initialSuggestionsPromise) {
      initialSuggestionsPromise = fetchSearchResults(
        searchUrl,
        config.initialQuery,
      ).catch((error) => {
        console.error(error);
        initialSuggestionsPromise = null;

        return null;
      });
    }

    return initialSuggestionsPromise;
  };

  const showInitialSuggestions = async () => {
    if (!config.initialQuery || !suggestionContainer || inputEl.value) {
      return;
    }

    const response = await prefetchInitialSuggestions();

    // The user may have typed while the request was in flight.
    if (!response || inputEl.value) {
      return;
    }

    const suggestionEl = createSuggestions(response, config);

    suggestionListLenght = response.hits.hits?.length || 0;
    activeIndex = -1;
    suggestionContainer.innerHTML = "";
    suggestionContainer.append(suggestionEl.element as Element);
    showingInitialSuggestions = true;
  };

  queryInputEl.showInitialSuggestions = showInitialSuggestions;

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
    const onSearch = createDebouncedSearch(searchUrl, (results) => {
      const suggestionEl = createSuggestions(results, config);
      suggestionListLenght = results.hits.hits?.length || 0;
      activeIndex = -1;

      if (suggestionContainer) {
        suggestionContainer.innerHTML = "";
        suggestionContainer.append(suggestionEl.element as Element);
      }

      showingInitialSuggestions = false;
    });

    if (config.submitInPlace) {
      const urlQuery =
        new URLSearchParams(window.location.search).get(queryParam) || "";

      if (urlQuery) {
        inputEl.value = urlQuery;
        clearButton?.classList.remove("stx-hidden");
      }
    }

    prefetchInitialSuggestions();

    // Focus alone is not a reliable trigger: `.focus()` emits no event when the
    // input is already focused, and a toggle that opens the input lives outside
    // `.stx-query-input`, so its click closes the dropdown. React to clicks too.
    inputEl.addEventListener("focus", () => {
      showInitialSuggestions();
    });

    inputEl.addEventListener("click", () => {
      showInitialSuggestions();
    });

    inputEl.addEventListener("input", (event) => {
      const { value } = event.target as HTMLInputElement;

      clearButton.classList.toggle("stx-hidden", !value.length);

      // Empty again: fall back to the preconfigured initial-query dropdown.
      if (!value.length) {
        closeSuggestions();
        showInitialSuggestions();

        return;
      }

      // Typing drops the initial-query results, and below `minSearchLength`
      // there is nothing to show until enough characters are typed.
      if (showingInitialSuggestions || value.length < config.minSearchLength) {
        closeSuggestions();
      }

      if (value.length >= config.minSearchLength) {
        onSearch(value);
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
          submitQuery(inputEl.value);
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
        closeSuggestions();
      }
    });

    // Picking a suggestion submits it as the query rather than opening the hit,
    // so the behaviour matches Enter: navigate to `searchPageUrl`, or refresh an
    // adjacent results panel when `submitInPlace` is set.
    suggestionContainer?.addEventListener("click", (e) => {
      const item = (e.target as Element).closest(".stx-suggestion__item");

      if (!item) {
        return;
      }

      e.preventDefault();

      const query = item.textContent?.trim() || "";

      inputEl.value = query;
      clearButton?.classList.remove("stx-hidden");
      submitQuery(query);
    });
  }

  if (clearButton && inputEl) {
    clearButton.addEventListener("click", () => {
      inputEl.value = "";
      closeSuggestions();
      inputEl.focus();
      showInitialSuggestions();
    });
  }

  if (searchButton) {
    // The button is dropped outright - not just hidden - when it would be dead
    // (nothing to submit to) or when the host provides its own submit control.
    const hasSubmitTarget = config.submitInPlace || config.searchPageUrl;

    if (config.showSearchButton && hasSubmitTarget) {
      searchButton.addEventListener("click", () => {
        submitQuery(inputEl.value);
      });
    } else {
      searchButton.remove();
    }
  }

  window.addEventListener("click", (e) => {
    const target = e.target as Element;

    if (target !== queryInputEl && !target.closest(".stx-query-input")) {
      closeSuggestions();
    }
  });

  return { element: queryInputEl, inputEl: inputEl };
}
