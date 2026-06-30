import {
  createSearchInModal,
  createSearchInput,
} from "../../../src/exports/search-inline";
import { addNavigation, renderCodeBlocks } from "../../js/helper";

const examples = {
  default: `createSearchInModal({
  searchOpenElementSelector: "#search-button-default",
  input: { searchApiUrl: "/search-data.json" },
});`,

  analytics: `createSearchInModal({
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

  input: { searchApiUrl: "/search-data.json" },
});`,

  placeholder: `createSearchInModal({
  searchOpenElementSelector: "#custom-search-input-placeholder",

  input: {
    searchApiUrl: "/search-data.json",
    labels: {
      inputPlaceholder: "Ask us a question",
    },
  },
});`,

  minLength: `createSearchInModal({
  searchOpenElementSelector: "#search-custom-character-limit",

  input: {
    searchApiUr: "/search-data.json"l,
    minSearchLength: 5,
  },
});`,

  externalClose: `createSearchInModal({
  searchOpenElementSelector: "#search-close-button-example",
  searchCloseElementSelector: "#search-close-button",
  useNonModal: true,

  input: { searchApiUrl: "/search-data.json" },
});`,

  itemRenderer: `createSearchInModal({
  searchOpenElementSelector: "#search-custom-item-renderer",

  input: {
    searchApiUrl: "/search-data.json",

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

  groupRenderer: `createSearchInModal({
  searchOpenElementSelector: "#search-no-group-render",

  input: {
    searchApiUrl: "/search-data.json",

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

  clearIcon: `createSearchInModal({
  searchOpenElementSelector: "#custom-clear-icon",

  input: {
    searchApiUrl: "/search-data.json",

    renderers: {
      clearIcon: () => \`
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="..."></path>
        </svg>
      \`,
    },
  },
});`,

  searchPage: `createSearchInModal({
  searchOpenElementSelector: "#with-search-icon",

  input: {
    searchApiUrl: "/search-data.json",
    searchPageUrl(query) {
      return \`/query?query=\${query}\`;
    },
  },
});`,

  "existing-input": `const navSearch = document.querySelector("#exising-search");

if (navSearch) {
  createSearchInput({
    searchApiUrl: "/search-data.json"
  }, navSearch);
}
  `,
};

renderCodeBlocks(examples);
addNavigation(document.body);

const searchApiUrl = "/search-data.json";

// default inline search
createSearchInModal({
  searchOpenElementSelector: "#search-button-default",
  input: {
    searchApiUrl,
  },
});

// search with analytics
createSearchInModal({
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
createSearchInModal({
  searchOpenElementSelector: "#custom-search-input-placeholder",
  input: {
    searchApiUrl,
    labels: {
      inputPlaceholder: "Ask us a question",
    },
  },
});

// custom character limit
createSearchInModal({
  searchOpenElementSelector: "#search-custom-character-limit",
  input: {
    minSearchLength: 5,
    searchApiUrl,
  },
});

// custom close button
createSearchInModal({
  searchOpenElementSelector: "#search-close-button-example",
  searchCloseElementSelector: "#search-close-button",
  useNonModal: true,
  input: {
    searchApiUrl,
  },
});

// item render
createSearchInModal({
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
createSearchInModal({
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
createSearchInModal({
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
createSearchInModal({
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
