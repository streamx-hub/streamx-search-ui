# StreamX Search UI API Reference

Compact reference for public exports, configuration objects, labels, renderers and shared types.

---

## Public API Overview

| Bundle               | Export                 | Description                                   |
| -------------------- | ---------------------- | --------------------------------------------- |
| Inline Search        | `createSearchInput()`  | Creates a standalone search input.            |
| Inline Search        | `mountSearchModal()`   | Creates a modal search.                       |
| Search Tabs          | `createSearchTabs()`   | Creates a search input with tabbed results.   |
| Search Results Panel | `createResultsPanel()` | Creates a search input with one result panel. |

---

# Inline Search

Import from:

```ts
import {
  createSearchInput,
  mountSearchModal,
} from "./dist/streamx-search-inline.js";
```

---

## createSearchInput()

Creates a standalone autocomplete search input.

```ts
createSearchInput(
  config: QueryInputConfig,
  mountPoint: Element
): HTMLElement
```

| Parameter    | Type               | Required | Description                                                                                                            |
| ------------ | ------------------ | :------: | ---------------------------------------------------------------------------------------------------------------------- |
| `config`     | `QueryInputConfig` |    ✅    | Search input configuration.                                                                                            |
| `mountPoint` | `Element`          |    ✅    | Element where the input should be mounted. If it is an `<input>`, it is replaced. Otherwise the component is appended. |

Example:

```ts
createSearchInput(
  {
    searchApiUrl: "/api/search",
  },
  document.querySelector("#search"),
);
```

---

## mountSearchModal()

Creates a search modal opened by a selected trigger element.

```ts
mountSearchModal(config: ModalConfig): void
```

| Parameter | Type          | Required | Description                    |
| --------- | ------------- | :------: | ------------------------------ |
| `config`  | `ModalConfig` |    ✅    | Modal and input configuration. |

Example:

```ts
mountSearchModal({
  searchOpenElementSelector: "#open-search",
  input: {
    searchApiUrl: "/api/search",
  },
});
```

---

## ModalConfig

Used by `mountSearchModal()`.

```ts
interface ModalConfig {
  searchOpenElementSelector: string;
  searchCloseElementSelector?: string;
  useNonModal?: boolean;
  analytics?: (event: AnalyticsEvents) => void;
  input: QueryInputConfig;
}
```

| Property                     | Type                               | Required |  Default   | Description                                             |
| ---------------------------- | ---------------------------------- | :------: | :--------: | ------------------------------------------------------- |
| `searchOpenElementSelector`  | `string`                           |    ✅    |     —      | Selector for the element that opens the modal.          |
| `searchCloseElementSelector` | `string`                           |    ❌    |     —      | Selector for an external element that closes the modal. |
| `useNonModal`                | `boolean`                          |    ❌    |  `false`   | Uses non-modal dialog behavior.                         |
| `analytics`                  | `(event: AnalyticsEvents) => void` |    ❌    | `() => {}` | Analytics event callback.                               |
| `input`                      | `QueryInputConfig`                 |    ✅    |     —      | Search input configuration.                             |

Example:

```ts
mountSearchModal({
  searchOpenElementSelector: "#open-search",
  searchCloseElementSelector: "#close-search",
  analytics: (event) => console.log(event),
  input: {
    searchApiUrl: "/api/search",
  },
});
```

---

## QueryInputConfig

Used by `createSearchInput()`, `mountSearchModal()`, `createSearchTabs()` and `createResultsPanel()`.

```ts
interface QueryInputConfig {
  minSearchLength?: number;
  searchApiUrl: string | (() => string);
  searchPageUrl?: (val: string) => string;
  groupByCategory?: boolean;
  labels?: Partial<QueryInputLabels>;
  renderers?: Partial<QueryInputRenderers>;
}
```

| Property          | Type                           | Required |      Default       | Description                               |
| ----------------- | ------------------------------ | :------: | :----------------: | ----------------------------------------- |
| `searchApiUrl`    | `string \| (() => string)`     |    ✅    |         —          | Suggestions/search endpoint URL.          |
| `searchPageUrl`   | `(val: string) => string`      |    ❌    |         —          | Builds the target search page URL.        |
| `minSearchLength` | `number`                       |    ❌    |        `3`         | Minimum query length before search.       |
| `groupByCategory` | `boolean`                      |    ❌    |       `true`       | Groups suggestions by item type/category. |
| `labels`          | `Partial<QueryInputLabels>`    |    ❌    |  Built-in labels   | Overrides input labels.                   |
| `renderers`       | `Partial<QueryInputRenderers>` |    ❌    | Built-in renderers | Overrides input renderers.                |

Example:

```ts
const inputConfig = {
  searchApiUrl: "/api/search",
  minSearchLength: 2,
  groupByCategory: true,
  searchPageUrl: (query) => `/search?stx-search=${encodeURIComponent(query)}`,
  labels: {
    inputPlaceholder: "Search products...",
  },
};
```

---

## QueryInputLabels

```ts
interface QueryInputLabels {
  inputPlaceholder: string;
  inputLabel: string;
  clearButtonAria: string;
  searchButtonAria: string;
}
```

| Property           | Default                | Description               |
| ------------------ | ---------------------- | ------------------------- |
| `inputPlaceholder` | `"Search"`             | Input placeholder.        |
| `inputLabel`       | `"Search"`             | Accessible input label.   |
| `clearButtonAria`  | `"Clear search input"` | Clear button aria label.  |
| `searchButtonAria` | `"Go to search page"`  | Search button aria label. |

Example:

```ts
labels: {
  inputPlaceholder: "Search articles...",
  clearButtonAria: "Clear search"
}
```

---

## QueryInputRenderers

```ts
interface QueryInputRenderers {
  suggestionItem: (suggestionItem: OpenSearchItem) => Element | undefined;
  groupItem: (groupItem: OpenSearchItem) => Element | undefined;
  clearIcon: () => HTMLElement | string;
  searchIcon: () => HTMLElement | string;
}
```

| Renderer         | Required | Default  | Description                       |
| ---------------- | :------: | :------: | --------------------------------- |
| `suggestionItem` |    ❌    | Built-in | Renders a single suggestion.      |
| `groupItem`      |    ❌    | Built-in | Renders a suggestion group label. |
| `clearIcon`      |    ❌    |  `"✕"`   | Renders the clear icon.           |
| `searchIcon`     |    ❌    |  `"🔍"`  | Renders the search icon.          |

Example:

```ts
renderers: {
  clearIcon: () => "×",
  searchIcon: () => "Search",
  suggestionItem: (item) => {
    const el = document.createElement("a");
    el.href = item._id;
    el.textContent = String(item._source.title ?? item._id);
    return el;
  }
}
```

---

# Search Tabs

Import from:

```ts
import { createSearchTabs } from "./dist/streamx-search-tabs.js";
```

---

## createSearchTabs()

Creates a search input with tabbed result panels.

```ts
createSearchTabs(
  inputConfig: QueryInputConfig,
  tabsConfig: TabConfig[],
  resultsRenderers?: CustomRenderersSet,
  debug?: boolean
): HTMLDivElement
```

| Parameter          | Type                 | Required | Description                           |
| ------------------ | -------------------- | :------: | ------------------------------------- |
| `inputConfig`      | `QueryInputConfig`   |    ✅    | Search input configuration.           |
| `tabsConfig`       | `TabConfig[]`        |    ✅    | Tabs and their result panel configs.  |
| `resultsRenderers` | `CustomRenderersSet` |    ❌    | Shared result renderers for all tabs. |
| `debug`            | `boolean`            |    ❌    | Enables debug mode.                   |

Example:

```ts
const searchTabs = createSearchTabs(
  {
    searchApiUrl: "/api/suggestions",
    searchPageUrl: (query) => `/search?stx-search=${encodeURIComponent(query)}`,
  },
  [
    {
      id: "products",
      displayName: "Products",
      results: {
        dataSources: ["/api/products"],
        pageSize: 12,
      },
    },
    {
      id: "articles",
      displayName: "Articles",
      results: {
        dataSources: ["/api/articles"],
      },
    },
  ],
);

document.querySelector("#app").append(searchTabs);
```

---

## TabConfig

```ts
interface TabConfig {
  id: string;
  displayName: string;
  results: ResultsConfig;
}
```

| Property      | Type            | Required | Default | Description                                |
| ------------- | --------------- | :------: | :-----: | ------------------------------------------ |
| `id`          | `string`        |    ✅    |    —    | Unique tab id. Used for generated DOM ids. |
| `displayName` | `string`        |    ✅    |    —    | Visible tab label.                         |
| `results`     | `ResultsConfig` |    ✅    |    —    | Result panel configuration for this tab.   |

Example:

```ts
{
  id: "products",
  displayName: "Products",
  results: {
    dataSources: ["/api/products"],
    pageSize: 12
  }
}
```

---

# Search Results Panel

Import from:

```ts
import { createResultsPanel } from "./dist/streamx-search-results-panel.js";
```

---

## createResultsPanel()

Creates a search input with a single result panel.

```ts
createResultsPanel(
  searchInputConfig: QueryInputConfig,
  resultPanelConfig: ResultsConfig
): HTMLDivElement
```

| Parameter           | Type               | Required | Description                 |
| ------------------- | ------------------ | :------: | --------------------------- |
| `searchInputConfig` | `QueryInputConfig` |    ✅    | Search input configuration. |
| `resultPanelConfig` | `ResultsConfig`    |    ✅    | Result panel configuration. |

Example:

```ts
const searchPage = createResultsPanel(
  {
    searchApiUrl: "/api/suggestions",
    searchPageUrl: (query) => `/search?stx-search=${encodeURIComponent(query)}`,
  },
  {
    dataSources: ["/api/search"],
    pageSize: 20,
  },
);

document.querySelector("#app").append(searchPage);
```

---

## ResultsConfig

Used by `createResultsPanel()` and `TabConfig.results`.

```ts
interface ResultsConfig {
  pageSize?: number;
  dataSources: string[];
  renderers?: CustomRenderersSet;
  labels?: ResultsPanelLabelsConfig;
}
```

| Property      | Type                       | Required |     Default     | Description                                                          |
| ------------- | -------------------------- | :------: | :-------------: | -------------------------------------------------------------------- |
| `dataSources` | `string[]`                 |    ✅    |        —        | Search result endpoints. Current implementation uses the first item. |
| `pageSize`    | `number`                   |    ❌    |      `20`       | Number of results per page.                                          |
| `renderers`   | `CustomRenderersSet`       |    ❌    |    Built-in     | Custom result renderers.                                             |
| `labels`      | `ResultsPanelLabelsConfig` |    ❌    | Built-in labels | Pagination and results labels.                                       |

Example:

```ts
{
  dataSources: ["/api/search"],
  pageSize: 10,
  labels: {
    totalResults: (total) => `${total} items`
  }
}
```

---

## ResultsPanelLabelsConfig

```ts
type ResultsPanelLabelsConfig = {
  paginationInfo?: (currentPage: number, pageNumber: number) => string;
  totalResults?: (totalCount: number) => string;
  ariaPaginationGoToPage?: (pageNumber: number) => string;
  ariaPaginationNavigation?: string;
};
```

| Property                   | Type                                  | Default                                | Description                                 |
| -------------------------- | ------------------------------------- | -------------------------------------- | ------------------------------------------- |
| `paginationInfo`           | `(currentPage, pageNumber) => string` | `Page ${currentPage} of ${pageNumber}` | Pagination text.                            |
| `totalResults`             | `(totalCount) => string`              | `${totalCount} results found.`         | Total results text and live region message. |
| `ariaPaginationGoToPage`   | `(pageNumber) => string`              | `Go to page ${pageNumber}`             | Pagination button aria label.               |
| `ariaPaginationNavigation` | `string`                              | `"Pagination"`                         | Pagination navigation aria label.           |

Example:

```ts
labels: {
  paginationInfo: (currentPage, pagesNumber) => `Page ${currentPage}/${pagesNumber}`,
  totalResults: (total) => `${total} results`,
  ariaPaginationGoToPage: (page) => `Open page ${page}`,
  ariaPaginationNavigation: "Search results pagination"
}
```

---

## CustomRenderersSet

Used by result panels and tabs.

```ts
type CustomRenderer = (...args: any[]) => HTMLElement;

type CustomRenderersSet = {
  [rendererName: string]: CustomRenderer;
};
```

| Renderer key   | Signature                               | Description                             |
| -------------- | --------------------------------------- | --------------------------------------- |
| `loader`       | `() => HTMLElement`                     | Custom loading element.                 |
| `error`        | `() => HTMLElement`                     | Custom error state.                     |
| `item-${type}` | `(item: OpenSearchItem) => HTMLElement` | Custom renderer for a result item type. |

Example:

```ts
renderers: {
  loader: () => {
    const el = document.createElement("span");
    el.textContent = "Loading...";
    return el;
  },

  "item-product/simple": (item) => {
    const el = document.createElement("article");
    el.textContent = String(item._source.title ?? item._id);
    return el;
  }
}
```

---

# Analytics

Used by `ModalConfig.analytics`.

```ts
type AnalyticsEvents =
  | { type: "streamx_modal_search_open" }
  | { type: "streamx_modal_search_close" }
  | {
      type: "streamx_modal_search_input_change";
      data: {
        input: string;
      };
    };
```

Example:

```ts
mountSearchModal({
  searchOpenElementSelector: "#open-search",
  analytics: (event) => {
    console.log(event.type, event);
  },
  input: {
    searchApiUrl: "/api/search",
  },
});
```

---

# Shared Types

## OpenSearchItem

```ts
interface OpenSearchItem {
  _id: string;
  _score: number | null;
  _source: {
    type?: string;
    [key: string]: any;
  };
  highlight?: Record<string, string[]>;
}
```

---

## OpenSearchResponse

```ts
interface OpenSearchResponse {
  timed_out: boolean;
  hits: {
    total: {
      value: number;
    };
    hits?: OpenSearchItem[];
  };
}
```

---

# URL Parameters

Result panels read the current search query from:

```txt
stx-search
```

Example:

```txt
/search?stx-search=laptop
```

Pagination requests add:

```txt
from=<offset>&size=<pageSize>
```

Example:

```txt
/api/search?from=0&size=20
```
