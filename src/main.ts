import "./style.css";
import createSearchInModal from "./inline-search/index.ts";
import { html } from "./helper.ts";

const appEl = document.body.querySelector("#app");

if (!appEl) {
  throw new Error("The app requires to have the #app element!");
}

appEl.innerHTML = `
  <h1>Streamx Search test page</h1>
  <p>Below are some examples of how to use streamx search.</p>

  <section>
    <h2>Default</h2>
    <p>Vesion with minimal configuration</p>
    <button id="search-button-default">Click button to open search 🔍</button>
  </section>

  <section>
    <h2>With custom action on inline modal open/close</h2>
    <p>Printing the "Modal open" and "Modal close" in the console.</p>
    <button id="search-button-modal-analytics">Click button to open search 🔍</button>
  </section>

  <section>
    <h2>Custom search input placeholder</h2>
    <button id="custom-search-input-placeholder">Click button to open search 🔍</button>
  </section>

  <section>
    <h2>Search when there are at least 5 characters</h2>
    <button id="search-custom-character-limit">Click button to open search 🔍</button>
  </section>

  <section>
    <h2>Search with external close button</h2>
    <button id="search-close-button-example">Click button to open search 🔍</button>
    <button id="search-close-button">Close modal</button>
  </section>

  <section>
    <h2>Search with custom item renderer</h2>
    <button id="search-custom-item-renderer">Click button to open search 🔍</button>
  </section>

  <section>
    <h2>Search without group render</h2>
    <button id="search-no-group-render">Click button to open search 🔍</button>
  </section>

  <section>
    <h2>Custom clear icon</h2>
    <button id="custom-clear-icon">Click button to open search 🔍</button>
  </section>

  <section>
    <h2>With search icon</h2>
    <button id="with-search-icon">Click button to open search 🔍</button>
  </section>
`;

const searchApiUrl = () => {
  const mock1 = "/src/assets/mocks/search-data.json";
  const mock2 = "/src/assets/mocks/search-data-2.json";

  return Math.random() > 0.5 ? mock1 : mock2;
};

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

createSearchInModal({
  searchOpenElementSelector: "#search-close-button-example",
  searchCloseElementSelector: "#search-close-button",
  useNonModal: true,
  input: {
    searchApiUrl,
  },
});

// custom item render
createSearchInModal({
  searchOpenElementSelector: "#search-custom-item-renderer",
  input: {
    searchApiUrl,
    renderers: {
      suggestionItem: (data) => {
        return html`
          <div style="padding: 10px 5px; color: purple;">
            <span>${data?.highlight?.["payload.content"][0]}</span>
          </div>
        ` as Element;
      },
    },
  },
});

// no group render
createSearchInModal({
  searchOpenElementSelector: "#search-no-group-render",
  input: {
    searchApiUrl,
    renderers: {
      groupItem: (group) => {
        return html`<div
          style="color: red; text-transform: uppercase; padding: 10px 5px;"
        >
          ${group._source.type}
        </div>` as Element;
      },
    },
  },
});

// custom clear icon
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
