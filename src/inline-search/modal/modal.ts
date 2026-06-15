import { fetchSearchResults, html, trapFocus } from '../../helper';
import './modal.tokens.css';
import './modal.css';
import type { InternalModalConfig } from '../../types/config';
import createSuggestions from '../suggestions/suggestions';
import type { OpenSearchResponse } from '../../types/results';

const createSearchModal = (config: InternalModalConfig) => {
  const { inputPlaceholder, inputLabel, clearButtonAria, searchButtonAria } =
    config.labels;
  const renderCloseIcon = config.renderers.clearIcon;
  const renderSearchIcon = config.renderers.searchIcon;
  const inputTextId = crypto.randomUUID();
  const suggestionWrapperId = crypto.randomUUID();

  const dialogEl = html`
    <dialog class="streamx-search-modal">
      <div class="streamx-search-modal__header">
        <button
          class="streamx-search-modal__search-button"
          type="submit"
          aria-label="${searchButtonAria}"
        >
          ${renderSearchIcon()}
        </button>
        <div class="streamx-search-modal__input-wrapper">
          <label for="${inputTextId}">${inputLabel}</label>
          <input
            class="streamx-search-modal__input"
            type="text"
            placeholder="${inputPlaceholder}"
            role="combobox"
            aria-expanded="false"
            aria-autocomplete="list"
            aria-controls="${suggestionWrapperId}"
            id="${inputTextId}"
          />
          <button
            class="streamx-search-modal__clear-button"
            type="button"
            aria-label="${clearButtonAria}"
          >
            ${renderCloseIcon()}
          </button>
        </div>
      </div>

      <div class="streamx-search-modal__body" id="${suggestionWrapperId}"></div>
    </dialog>
  ` as HTMLDialogElement;

  const inputEl = dialogEl.querySelector(
    '.streamx-search-modal__input',
  ) as HTMLInputElement;
  const suggestionContainer = dialogEl.querySelector(
    '.streamx-search-modal__body',
  );
  const clearButton = dialogEl.querySelector(
    '.streamx-search-modal__clear-button',
  ) as HTMLButtonElement;
  const searchButton = dialogEl.querySelector(
    '.streamx-search-modal__search-button',
  ) as HTMLButtonElement;
  let restoreFocus: (() => void) | null;
  let activeIndex = -1;
  let suggestionListLenght = 0;

  const updateActiveItem = () => {
    if (!suggestionContainer) {
      return;
    }

    const elements = suggestionContainer.querySelectorAll(
      '.streamx-search-modal__suggestion-item',
    ) as NodeListOf<HTMLElement>;

    elements.forEach((el, index) => {
      if (index === activeIndex) {
        el.classList.add('is-active');
        el.setAttribute('aria-selected', 'true');
        el.scrollIntoView({ block: 'nearest' });
        el.setAttribute('tabindex', '0');
        inputEl.setAttribute('aria-activedescendant', el.id);
      } else {
        el.classList.remove('is-active');
        el.setAttribute('aria-selected', 'false');
        el.setAttribute('tabindex', '-1');
      }
    });

    if (activeIndex === -1) {
      inputEl.removeAttribute('aria-activedescendant');
    }
  };

  if (inputEl) {
    inputEl.addEventListener('input', async (event) => {
      const { value } = event.target as HTMLInputElement;

      if (value.length >= config.minSearchLength) {
        let url = '';

        if (typeof config.searchApiUrl === 'string') {
          url = config.searchApiUrl;
        } else {
          url = config.searchApiUrl();
        }

        await fetchSearchResults(url, (results: OpenSearchResponse) => {
          const suggestionEl = createSuggestions(results, config);
          suggestionListLenght = results.hits.hits.length;
          activeIndex = -1;

          if (suggestionContainer) {
            suggestionContainer.innerHTML = '';
            suggestionContainer.append(suggestionEl.element as Element);
          }
        });
      }

      if (!value.length && suggestionContainer) {
        suggestionContainer.innerHTML = '';
        suggestionListLenght = 0;
      }
    });

    inputEl.addEventListener('keydown', (e) => {
      const { key } = e;

      if (!suggestionListLenght) {
        return;
      }

      const maxIndex = suggestionListLenght;

      if (key === 'ArrowDown') {
        e.preventDefault();

        if (maxIndex === 0) return;

        activeIndex = activeIndex < maxIndex ? activeIndex + 1 : 0;
        updateActiveItem();
      } else if (key === 'ArrowUp') {
        e.preventDefault();

        if (maxIndex === 0) return;

        activeIndex = activeIndex > 0 ? activeIndex - 1 : maxIndex;
        updateActiveItem();
      } else if (key === 'Enter') {
        if (activeIndex > -1 && suggestionContainer) {
          e.preventDefault();
          const elements = suggestionContainer.querySelectorAll(
            '.streamx-search-modal__suggestion-item',
          ) as NodeListOf<HTMLElement>;

          elements[activeIndex]?.click();
        }
      }
    });
  }

  if (!dialogEl || !inputEl) {
    throw new Error('test');
  }

  const openModal = () => {
    if (dialogEl.open) {
      return;
    }

    restoreFocus = trapFocus();

    if (config.useNonModal) {
      dialogEl.show();
    } else {
      dialogEl.showModal();
    }
    inputEl.focus();

    config?.analytics?.({
      type: 'streamx_modal_search_open',
    });
  };

  const closeModal = () => {
    if (!dialogEl.open) {
      return;
    }

    dialogEl.close();
  };

  dialogEl.addEventListener('close', () => {
    if (restoreFocus) {
      restoreFocus();
    }

    config?.analytics?.({
      type: 'streamx_modal_search_close',
    });
  });

  dialogEl.addEventListener('click', (e) => {
    if (e.target && e.target === dialogEl) {
      dialogEl.close();
    }
  });

  if (clearButton && inputEl && suggestionContainer) {
    clearButton.addEventListener('click', () => {
      inputEl.value = '';
      suggestionContainer.innerHTML = '';
      suggestionListLenght = 0;
      inputEl.focus();
    });
  }

  if (searchButton && config.searchPageUrl) {
    const { searchPageUrl } = config;

    searchButton.addEventListener('click', () => {
      const link = searchPageUrl(inputEl.value);

      window.location.href = link.toString();
    });
  } else {
    if (searchButton) {
      searchButton.remove();
    }
  }

  return {
    element: dialogEl,
    openModal,
    closeModal,
  };
};

export { createSearchModal };
