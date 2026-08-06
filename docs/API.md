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
| `searchOpenElementSelector`  | `string`                           |    ✅    |     -      | Selector for the element that opens the modal.          |
| `searchCloseElementSelector` | `string`                           |    ❌    |     -      | Selector for an external element that closes the modal. |
| `useNonModal`                | `boolean`                          |    ❌    |  `false`   | Uses non-modal dialog behavior.                         |
| `analytics`                  | `(event: AnalyticsEvents) => void` |    ❌    | `() => {}` | Analytics event callback.                               |
| `input`                      | `QueryInputConfig`                 |    ✅    |     -      | Search input configuration.                             |

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
  queryParam?: string;
  initialQuery?: string;
  submitInPlace?: boolean;
  showSearchButton?: boolean;
  namespace?: string;
  labels?: Partial<QueryInputLabels>;
  renderers?: Partial<QueryInputRenderers>;
}
```

| Property           | Type                           | Required |      Default       | Description                                                                                                    |
| ------------------ | ------------------------------ | :------: | :----------------: | -------------------------------------------------------------------------------------------------------------- |
| `searchApiUrl`     | `string \| (() => string)`     |    ✅    |         -          | Suggestions/search endpoint URL.                                                                               |
| `searchPageUrl`    | `(val: string) => string`      |    ❌    |         -          | Builds the target search page URL.                                                                             |
| `minSearchLength`  | `number`                       |    ❌    |        `3`         | Minimum query length before search.                                                                            |
| `groupByCategory`  | `boolean`                      |    ❌    |       `true`       | Groups suggestions by item type/category.                                                                      |
| `queryParam`       | `string`                       |    ❌    |     `"query"`      | URL param the query is written to. Must match the results panel's `queryParam`.                                |
| `initialQuery`     | `string`                       |    ❌    |         -          | Query pre-fetched on render and offered while the input is focused and empty.                                  |
| `submitInPlace`    | `boolean`                      |    ❌    |      `false`       | Submit by writing `queryParam` to the current URL instead of navigating away.                                  |
| `showSearchButton` | `boolean`                      |    ❌    |       `true`       | Renders the built-in search (submit) button. Set `false` when the host markup provides its own submit control. |
| `namespace`        | `string`                       |    ❌    |         -          | Limits suggestions to one content namespace, sent as a `namespace` query param. Omit to search all of them.    |
| `labels`           | `Partial<QueryInputLabels>`    |    ❌    |  Built-in labels   | Overrides input labels.                                                                                        |
| `renderers`        | `Partial<QueryInputRenderers>` |    ❌    | Built-in renderers | Overrides input renderers.                                                                                     |

### Submitting

Pressing <kbd>Enter</kbd>, picking a suggestion, or clicking the search button
all submit the current query. Where it goes depends on the configuration:

- `submitInPlace: true` - writes `queryParam` to the current URL, so a results
  panel on the same page refreshes without a navigation. Use this when the input
  sits above its own results.
- otherwise - navigates to `searchPageUrl(query)`. Use this for a header input
  that should take the user to a search results page.

`submitInPlace` is checked first, so setting it alongside a `searchPageUrl`
makes the latter dead configuration. The EDS decorators derive it for you: they
set `submitInPlace` only when the block has no `searchPageUrl`.

### The search button

The built-in search button is a submit affordance, so it is **removed from the
DOM** (not hidden) when it would do nothing - i.e. when neither `submitInPlace`
nor `searchPageUrl` is set.

Set `showSearchButton: false` to drop it even when the input _can_ submit. Use
this when the surrounding markup already offers its own control - for example a
nav search that lives behind its own magnifier toggle, where the built-in button
would be a duplicate icon. Submitting with <kbd>Enter</kbd> is unaffected.

### `initialQuery`

When set, its results are fetched once on render and shown whenever the input is
focused while empty - so the dropdown offers something before the user types.
Typing dismisses them; clearing the input brings them back.

Because focus alone is not a reliable trigger (`.focus()` emits no event when the
element is already focused), the returned element also exposes
`showInitialSuggestions()` for cases where something else opens the input:

```ts
const input = createSearchInput({ searchApiUrl, initialQuery: "popular" }, el);

navToggle.addEventListener("click", () => input.showInitialSuggestions());
```

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
  resultsRenderers?: ResultsPanelRenderers,
  debug?: boolean
): HTMLDivElement
```

| Parameter          | Type                    | Required | Description                           |
| ------------------ | ----------------------- | :------: | ------------------------------------- |
| `inputConfig`      | `QueryInputConfig`      |    ✅    | Search input configuration.           |
| `tabsConfig`       | `TabConfig[]`           |    ✅    | Tabs and their result panel configs.  |
| `resultsRenderers` | `ResultsPanelRenderers` |    ❌    | Shared result renderers for all tabs. |
| `debug`            | `boolean`               |    ❌    | Enables debug mode.                   |

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
| `id`          | `string`        |    ✅    |    -    | Unique tab id. Used for generated DOM ids. |
| `displayName` | `string`        |    ✅    |    -    | Visible tab label.                         |
| `results`     | `ResultsConfig` |    ✅    |    -    | Result panel configuration for this tab.   |

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
  renderers?: ResultsPanelRenderers;
  labels?: ResultsPanelLabelsConfig;
  method?: "GET" | "POST";
  queryParam?: string;
  facetDepthLevel?: number;
  requestId?: string;
  facetFilterField?: string;
  facetFieldPrefix?: string;
  facetPathSeparator?: string;
  facetFieldSize?: number;
  debugMode?: boolean;
  stateKey?: string;
  namespace?: string;
  sortOptions?: SortItem[];
  sortParam?: string;
}
```

| Property             | Type                       | Required |                                                                   Default                                                                   | Description                                                                                                                                                                                                                              |
|----------------------|----------------------------|:--------:|:-------------------------------------------------------------------------------------------------------------------------------------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `dataSources`        | `string[]`                 |    ✅    |                                                                      -                                                                      | Search result endpoints. Current implementation uses the first item.                                                                                                                                                                     |
| `pageSize`           | `number`                   |    ❌    |                                                                    `20`                                                                     | Number of results per page.                                                                                                                                                                                                              |
| `renderers`          | `ResultsPanelRenderers`    |    ❌    |                                                                  Built-in                                                                   | Custom result renderers.                                                                                                                                                                                                                 |
| `labels`             | `ResultsPanelLabelsConfig` |    ❌    |                                                               Built-in labels                                                               | Pagination and results labels.                                                                                                                                                                                                           |
| `method`             | `"GET" \| "POST"`          |    ❌    |                                                                   `"GET"`                                                                   | Transport. **Facets and filtering require `"POST"`**, since they travel in the body.                                                                                                                                                     |
| `queryParam`         | `string`                   |    ❌    |                                                                  `"query"`                                                                  | URL param carrying the query. Must match the query input's `queryParam`.                                                                                                                                                                 |
| `facetDepthLevel`    | `number`                   |    ❌    |                                                                     `1`                                                                     | How deep the facet aggregations nest. `1` requests a single flat level.                                                                                                                                                                  |
| `requestId`          | `string`                   |    ❌    |                                                                      -                                                                      | Saved query/template id sent as the request body `id`.                                                                                                                                                                                   |
| `facetFilterField`   | `string`                   |    ❌    |                                                           `"category_hierarchy"`                                                            | Field the selected facet values are filtered against.                                                                                                                                                                                    |
| `facetFieldPrefix`   | `string`                   |    ❌    |                                                             `"category_level"`                                                              | Field name prefix for facet levels; the level index is appended.                                                                                                                                                                         |
| `facetPathSeparator` | `string`                   |    ❌    |                                                                    `">"`                                                                    | Separator used to build hierarchical facet values (e.g. `Electronics>Tablet`).                                                                                                                                                           |
| `facetFieldSize`     | `number`                   |    ❌    |                                                                    `20`                                                                     | Max buckets requested per facet level.                                                                                                                                                                                                   |
| `debugMode`          | `boolean`                  |    ❌    |                                                                   `false`                                                                   | Renders debug diagnostics in the results list (the "Missing renderer" notice for an unhandled result type, and a notice when a renderer throws). When `false`, those rows are dropped entirely - a console warning is logged either way. |
| `stateKey`           | `string`                   |    ❌    |                                                                      -                                                                      | Namespaces the panel's `stx-facets` URL param. Set automatically to the tab id inside search tabs; omit for a standalone panel.                                                                                                          |
| `namespace`          | `string`                   |    ❌    |                                                                      -                                                                      | Limits results to one content namespace. Sent as a `namespace` query param on `GET`, and inside `params` in the body on `POST`. Omit to search all of them.                                                                              |
| `sortOptions`        | `SortItem[]`               |    ❌    | `[{ label: 'Relevance', sortBy: null }, { label: 'Date (Newest)', sortBy: 'date__desc' }, { label: 'Date (Oldest)', sortBy: 'date__asc' }]` | List of available sorting options                                                                                                                                                                                                        |
| `sortParam`          | `string`                   |    ❌    |                                                                 `"sort-by"`                                                                 | URL param carrying sorting option.                                                                                                                                                                                                       |

### Facets

Facets are rendered from the `aggregations` the endpoint returns, so the panel
adapts to whatever comes back - a flat aggregation renders as a plain checkbox
list, a nested one as a collapsible tree. When the response carries no usable
aggregations - as with the default `method: "GET"`, or when every aggregation
comes back with empty buckets - the facets sidebar is not rendered at all and
the results take the full width.

Requesting a `facetDepthLevel` deeper than the index actually nests is safe:
the degenerate sub-aggregations some backends return in that case - a level
nesting its own field again (which would duplicate the node as its own child)
or a child level with no buckets (which would render an expander that opens
onto nothing) - are treated as "no children" and skipped.

Selecting a value filters on `facetFilterField` using the value's **full
hierarchical path** (`Electronics>Tablet`, joined with `facetPathSeparator`).
The path already encodes its ancestors, so only the value the user actually
ticked is ever sent - the ancestors are never added alongside it.

#### How selections combine

Selections are grouped per facet **tree** - the top-level aggregation a value
belongs to, whatever depth it sits at:

- values within one tree are **OR-ed** into a single `filter_query.fields` entry
- separate trees become separate entries, which are **AND-ed**

So ticking `Electronics > Tablet` and the top-level `Technology` - both in the
`category_level0` tree - sends one entry with both paths and returns the union.
Splitting them across two entries would AND them and match nothing, which is why
grouping is per tree rather than per aggregation level.

```jsonc
// Electronics>Tablet + Technology, one tree
{
  "filter_query": {
    "fields": [
      {
        "name": "category_hierarchy",
        "values": ["Electronics>Tablet", "Technology"],
        "last": true,
      },
    ],
  },
}
```

When nothing is selected, `filter_query` is omitted entirely.

#### Parent and child interaction

Because ancestors are not sent, the checkbox tree keeps parents in sync
visually instead:

- a parent whose own path is selected renders **checked**
- a parent with a selection somewhere beneath it renders **indeterminate**
  (exposed to assistive tech as "mixed"). This is presentation only - an
  indeterminate node contributes nothing to the request.

Both states are derived from the current selection on every render, so they stay
correct through ticking, unticking and refetching.

Two rules keep the selection minimal:

- **Ticking a parent** clears any selection beneath it, selects the parent, and
  collapses its subtree - the parent already matches those documents.
- **Ticking the last unselected child** of a parent rolls the selection up: the
  children are replaced by the parent and the subtree collapses. `(A OR B OR C)`
  becomes `(parent)`.

> The rollup is a deliberate simplification. It matches the same documents
> whenever every document under the parent is also filed under one of its
> children - true for the current index - but a document filed directly on the
> parent with no child value would be matched by the rolled-up filter and not by
> the explicit union.

```ts
{
  dataSources: ["/api/search"],
  method: "POST",
  requestId: "eds-pages",
  facetDepthLevel: 3, // category_level0 → category_level1 → category_level2
}
```

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
  sortBy?: string;
};
```

| Property                   | Type                                  | Default                                | Description                                 |
|----------------------------|---------------------------------------|----------------------------------------|---------------------------------------------|
| `paginationInfo`           | `(currentPage, pageNumber) => string` | `Page ${currentPage} of ${pageNumber}` | Pagination text.                            |
| `totalResults`             | `(totalCount) => string`              | `${totalCount} results found.`         | Total results text and live region message. |
| `ariaPaginationGoToPage`   | `(pageNumber) => string`              | `Go to page ${pageNumber}`             | Pagination button aria label.               |
| `ariaPaginationNavigation` | `string`                              | `"Pagination"`                         | Pagination navigation aria label.           |
| `sortBy`                   | `string`                              | `"Sort by:"`                           | Sort field label.                           |

Example:

```ts
labels: {
  paginationInfo: (currentPage, pagesNumber) => `Page ${currentPage}/${pagesNumber}`,
  totalResults: (total) => `${total} results`,
  ariaPaginationGoToPage: (page) => `Open page ${page}`,
  ariaPaginationNavigation: "Search results pagination",
  sortBy: 'Sort options:'
}
```

---

## getHitUrl()

Derives a hit's URL from its `_id`, which carries the content namespace as a
prefix. Exported from every entry point, so a custom `item-*` renderer can link
results without re-implementing the convention.

```ts
getHitUrl(item: OpenSearchItem): string
```

```txt
{ _id: "en:/en/blog/post", _source: { namespace: "en" } }  ->  "/en/blog/post"
{ _id: "/about",           _source: { namespace: null } }  ->  "/about"
```

The prefix is stripped only when the hit actually carries that namespace, so
hits with a null, empty or missing one keep their `_id` as the URL.

Result rows are rendered as plain list items - wrap them in a link yourself when
you want the row to be clickable:

```ts
const renderers = {
  "item-page/eds-page": (item) => {
    const link = document.createElement("a");
    link.href = getHitUrl(item);
    link.textContent = String(item._source.payload.title);
    return link;
  },
};
```

---

## ResultsPanelRenderers

Used by result panels and tabs.

```ts
type CustomRenderer = (...args: any[]) => HTMLElement;

type ResultsPanelRenderers = {
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

The components persist their state in the URL so a search is shareable and
survives a reload. All four params are restored on load.

| Param        | Written by    | Purpose                                                                                          |
|--------------| ------------- |--------------------------------------------------------------------------------------------------|
| `query`      | Search input  | Active query. Configurable via `queryParam`; the input writes it and the results panel reads it. |
| `stx-tab`    | Search tabs   | Active tab id. Present only for a non-default tab, so the first tab keeps the URL clean.         |
| `stx-facets` | Results panel | Selected facets, as URL-encoded JSON (`{ "<treeField>": ["<path>", ...] }`). Absent when none.   |
| `sort-by`    | Results panel | Selected sorting field and sort direction.                                                       |

Inside search tabs the facet param is suffixed with the tab id
(`stx-facets-<tabId>`) via the panel's `stateKey`, so each tab persists its own
selection in the same URL without colliding.

Example of a fully deep-linked search:

```txt
/search?query=laptop&sort-by=date__desc&stx-tab=products&stx-facets-products=%7B%22category_level0%22%3A%5B%22Electronics%3ETablet%22%5D%7D
```

The query and tab params use `pushState`; facet changes use `replaceState`, so
ticking checkboxes does not spam the browser history. Changing the query clears
the facet param.

### Deep-linked facets and the aggregations request

Facets are built once per query and then left in place, so during a session the
tree always describes the **unfiltered** result set - selecting a value narrows
the results without removing its siblings from the sidebar.

A deep-linked load has no unfiltered response to build from: its first request
already carries the restored filters, and those aggregations only describe the
selection. Building the tree from them would drop every unselected sibling and
leave no way to widen the search.

So when (and only when) a panel loads **with facets restored from the URL**, it
issues a second request for the aggregations alone - unfiltered, `size: 0`, in
parallel with the results request, sharing the same abort signal. If it fails,
the tree falls back to the filtered response.

> A backend that computes aggregations before applying the filter (OpenSearch
> `post_filter`) would make the extra request unnecessary - the single response
> would carry filtered hits and unfiltered facets.

Pagination requests add:

```txt
from=<offset>&size=<pageSize>
```

Example:

```txt
/api/search?from=0&size=20
```
