import {
  mountSearchModal,
  createSearchInput,
} from "../../../src/exports/search-inline";
import { addNavigation, renderCodeBlocks } from "../../js/helper";

const examples = {
  default: `mountSearchModal({
  searchOpenElementSelector: "#search-button-default",
  input: { searchApiUrl: "http://localhost:8082/search/pages" },
});`,

  analytics: `mountSearchModal({
  searchOpenElementSelector: "#search-button-modal-analytics",

  analytics(event) {
    switch (event.type) {
      case "streamx_modal_search_open":
        console.log("Modal open");
        break;
      case "streamx_modal_search_close":
        console.log("Modal close");
        break;
    }
  },

  input: { searchApiUrl: "http://localhost:8082/search/pages" },
});`,

  placeholder: `mountSearchModal({
  searchOpenElementSelector: "#custom-search-input-placeholder",

  input: {
    searchApiUrl: "http://localhost:8082/search/pages",
    labels: {
      inputPlaceholder: "Ask us a question",
    },
  },
});`,

  minLength: `mountSearchModal({
  searchOpenElementSelector: "#search-custom-character-limit",

  input: {
    searchApiUr: "http://localhost:8082/search/pages"l,
    minSearchLength: 5,
  },
});`,

  externalClose: `mountSearchModal({
  searchOpenElementSelector: "#search-close-button-example",
  searchCloseElementSelector: "#search-close-button",
  useNonModal: true,

  input: { searchApiUrl: "http://localhost:8082/search/pages" },
});`,

  itemRenderer: `mountSearchModal({
  searchOpenElementSelector: "#search-custom-item-renderer",

  input: {
    searchApiUrl: "http://localhost:8082/search/pages",

    renderers: {
      suggestionItem(data) {
        const el = document.createElement("div");
        el.style.color = "green";
        el.textContent = data._source.payload.title;
        return el;
      },
    },
  },
});`,

  groupRenderer: `mountSearchModal({
  searchOpenElementSelector: "#search-no-group-render",

  input: {
    searchApiUrl: "http://localhost:8082/search/pages",

    renderers: {
      groupItem(group) {
        const el = document.createElement("div");
        el.style =
          "color:red;text-transform:uppercase;padding:10px 5px;";
        el.textContent = group._source.type;
        return el;
      },
    },
  },
});`,

  clearIcon: `mountSearchModal({
  searchOpenElementSelector: "#custom-clear-icon",

  input: {
    searchApiUrl: "http://localhost:8082/search/pages",

    renderers: {
      clearIcon: () => \`
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="..."></path>
        </svg>
      \`,
    },
  },
});`,

  searchPage: `mountSearchModal({
  searchOpenElementSelector: "#with-search-icon",

  input: {
    searchApiUrl: "http://localhost:8082/search/pages",
    searchPageUrl(query) {
      return \`/query?query=\${query}\`;
    },
  },
});`,

  "existing-input": `const navSearch = document.querySelector("#exising-search");

if (navSearch) {
  createSearchInput({
    searchApiUrl: "http://localhost:8082/search/pages"
  }, navSearch);
}
  `,
};

renderCodeBlocks(examples);
addNavigation(document.body);

const searchApiUrl = "http://localhost:8082/search/pages";

// default inline search
mountSearchModal({
  searchOpenElementSelector: "#search-button-default",
  input: {
    searchApiUrl,
  },
});

// search with analytics
mountSearchModal({
  searchOpenElementSelector: "#search-button-modal-analytics",
  analytics: (event) => {
    switch (event.type) {
      case "streamx_modal_search_open":
        console.log("Modal open");
        break;
      case "streamx_modal_search_close":
        console.log("Modal close");
        break;
    }
  },
  input: {
    searchApiUrl,
  },
});

// custom search input placeholder
mountSearchModal({
  searchOpenElementSelector: "#custom-search-input-placeholder",
  input: {
    searchApiUrl,
    labels: {
      inputPlaceholder: "Ask us a question",
    },
  },
});

// custom character limit
mountSearchModal({
  searchOpenElementSelector: "#search-custom-character-limit",
  input: {
    minSearchLength: 5,
    searchApiUrl,
  },
});

// custom close button
mountSearchModal({
  searchOpenElementSelector: "#search-close-button-example",
  searchCloseElementSelector: "#search-close-button",
  useNonModal: true,
  input: {
    searchApiUrl,
  },
});

// item render
mountSearchModal({
  searchOpenElementSelector: "#search-custom-item-renderer",
  input: {
    searchApiUrl,
    renderers: {
      suggestionItem: (data) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.style = "color: green;";
        suggestionItem.innerHTML = `<span>${data?._source.payload?.title}</span>`;

        return suggestionItem;
      },
    },
  },
});

// group render
mountSearchModal({
  searchOpenElementSelector: "#search-no-group-render",
  input: {
    searchApiUrl,
    renderers: {
      groupItem: (group) => {
        const groupItem = document.createElement("div");
        groupItem.style =
          "color: red; text-transform: uppercase; padding: 10px 5px;";
        groupItem.innerHTML = `<span>${group._source.type}</span>`;

        return groupItem;
      },
    },
  },
});

// clear icon
mountSearchModal({
  searchOpenElementSelector: "#custom-clear-icon",
  input: {
    searchApiUrl,
    renderers: {
      clearIcon: () => `
          <svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l10 16H2L12 3z"></path>
          </svg>
      `,
    },
  },
});

// with search icon
mountSearchModal({
  searchOpenElementSelector: "#with-search-icon",
  input: {
    searchApiUrl,
    searchPageUrl: (query) => `/query?query=${query}`,
  },
});

// replacing the existing input with the search one
const navSearch = document.querySelector("#existing-search");

if (navSearch) {
  createSearchInput(
    {
      searchApiUrl,
    },
    navSearch,
  );
}
