# StreamX Search UI

Lightweight, framework-independent search UI components written in TypeScript.

The library provides ready-to-use search inputs, modal search, tabbed search pages and single search result panels. It can be used on any website without React, Vue, Angular or another frontend framework.

---

## Features

- Framework independent
- TypeScript-first API
- Autocomplete search input
- Search modal
- Search page with tabs
- Search page without tabs
- Custom labels and renderers
- Optional analytics callback
- Multiple facet trees, hierarchical
- Namespace-scoped search (e.g. per locale)
- Debug mode for unhandled result types
- Accessible default markup

---

## Documentation

The following documents provide additional information about the library:

| Document                                    | Description                      |
| ------------------------------------------- | -------------------------------- |
| [API.md](./docs/API.md)                     | Complete API reference.          |
| [CUSTOMIZATION.md](./docs/CUSTOMIZATION.md) | Styling and customization guide. |

---

## Installation

Use the files generated in the `dist` directory.

```html
<link rel="stylesheet" href="./dist/streamx-search-inline.css" />
<script type="module" src="./dist/streamx-search-inline.js"></script>
```

If you use a bundler, import the selected entry and its CSS in your application code.

```ts
import { mountSearchModal } from "./dist/streamx-search-inline.js";
import "./dist/streamx-search-inline.css";
```

> Exact output filenames can depend on your build configuration. Use the matching JS and CSS file generated for the selected entry.

---

## Distribution Files

| Entry                | JS file                           | Use when                                                  |
| -------------------- | --------------------------------- | --------------------------------------------------------- |
| Inline Search        | `streamx-search-inline.js`        | You need a standalone autocomplete input or modal search. |
| Search Tabs          | `streamx-search-tabs.js`          | You need a full search page with multiple result tabs.    |
| Search Results Panel | `streamx-search-results-panel.js` | You need one search input with one result panel.          |

---

## Adobe Edge Delivery Services

The library provides EDS-specific entry points that simplify integration with Adobe Edge Delivery Services.

Instead of manually creating and configuring components, an EDS block only needs to delegate to the corresponding StreamX integration helper.

See `docs/EDS.md` for details.

---

## Which files should I import?

### Inline Search

Use for header search, navigation search, autocomplete input or modal search.

```html
<script type="module">
  import {
    createSearchInput,
    mountSearchModal,
  } from "./dist/streamx-search-inline.js";
</script>
```

---

### Search Page with Tabs

Use when results should be split into multiple tabs, for example Products, Articles and Pages.

```html
<script type="module">
  import { createSearchTabs } from "./dist/streamx-search-tabs.js";
</script>
```

---

### Search Page without Tabs

Use when results should be shown in a single panel.

```html
<script type="module">
  import { createResultsPanel } from "./dist/streamx-search-results-panel.js";
</script>
```

---

## Quick Start

### Inline Search Input

```html
<div id="search"></div>

<script type="module">
  import { createSearchInput } from "./dist/streamx-search-inline.js";

  createSearchInput(
    {
      searchApiUrl: "/api/search",
    },
    document.querySelector("#search"),
  );
</script>
```

---

### Search Modal

```html
<button id="open-search">Search</button>

<script type="module">
  import { mountSearchModal } from "./dist/streamx-search-inline.js";

  mountSearchModal({
    searchOpenElementSelector: "#open-search",
    input: {
      searchApiUrl: "/api/search",
    },
  });
</script>
```

---

### Search Page with Tabs

```html
<div id="app"></div>

<script type="module">
  import { createSearchTabs } from "./dist/streamx-search-tabs.js";

  const searchPage = createSearchTabs(
    {
      searchApiUrl: "/api/suggestions",
      searchPageUrl: (query) =>
        `/search?stx-search=${encodeURIComponent(query)}`,
    },
    [
      {
        id: "products",
        displayName: "Products",
        results: {
          dataSources: ["/api/products"],
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

  document.querySelector("#app").append(searchPage);
</script>
```

---

### Search Page without Tabs

```html
<div id="app"></div>

<script type="module">
  import { createResultsPanel } from "./dist/streamx-search-results-panel.js";

  const searchPage = createResultsPanel(
    {
      searchApiUrl: "/api/suggestions",
      searchPageUrl: (query) =>
        `/search?stx-search=${encodeURIComponent(query)}`,
    },
    {
      dataSources: ["/api/search"],
      pageSize: 20,
    },
  );

  document.querySelector("#app").append(searchPage);
</script>
```

---

## Public API Overview

| Bundle               | Export                 | Description                                   |
| -------------------- | ---------------------- | --------------------------------------------- |
| Inline Search        | `createSearchInput()`  | Creates a standalone search input.            |
| Inline Search        | `mountSearchModal()`   | Creates a modal search.                       |
| Search Tabs          | `createSearchTabs()`   | Creates a search page with tabs.              |
| Search Results Panel | `createResultsPanel()` | Creates a search input with one result panel. |

See [`API.md`](./docs/API.md) for the full API reference.

---

## Search Endpoint

The result panel expects a response compatible with this shape:

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

Result panel requests include pagination params:

```txt
?from=0&size=20
```

The current search query is read from the `query` URL parameter by default,
configurable per component via `queryParam` (the search input writes it and the
results panel reads it, so both sides must use the same value).

### Shareable / deep-linkable URLs

Search state is persisted in the URL so a search can be shared or reloaded and
comes back as it was:

- `query` - the active query (fills the input and runs the search)
- `stx-tab` - the active tab (search tabs only)
- `stx-facets` - the selected facets (URL-encoded JSON; inside tabs it is
  suffixed with the tab id, e.g. `stx-facets-products`)

All three are restored on load. See [`API.md`](./docs/API.md#url-parameters) for
the exact format.

## Facets

Facets are configured by their **root** name only - the rest of the field names
follow the index convention:

```ts
createResultsPanel(
  { searchApiUrl: "/api/suggestions" },
  {
    dataSources: ["/api/search"],
    method: "POST",
    facetFields: ["category", "tags"], // one facet tree per root
    facetDepthLevel: 3, // applies to every root
  },
);
```

| Root       | Aggregated on                             | Selections filter against |
| ---------- | ----------------------------------------- | ------------------------- |
| `category` | `category_level0` → `_level1` → `_level2` | `category_hierarchy`      |
| `tags`     | `tags_level0` → `_level1` → `_level2`     | `tags_hierarchy`          |

Each tree filters against its own `<root>_hierarchy` field, so the same value
appearing in two trees stays distinct. Values within one tree are OR-ed, and
separate trees are AND-ed. In EDS, author it as a comma-separated
`facetFields` row.

Defaults to `["category"]`. See [`API.md`](./docs/API.md#facets) for the full
selection semantics.

## Namespaces

Indexes can hold content from several namespaces at once - typically one per
locale. Set `namespace` to limit a search to one of them:

```ts
createResultsPanel(
  { searchApiUrl: "/api/suggestions", namespace: "de" },
  { dataSources: ["/api/search"], method: "POST", namespace: "de" },
);
```

It is optional everywhere. Omit it and the endpoint searches across **all**
namespaces, which is the right choice for a single-locale site - and the wrong
one for a localized page, which would then show results from other languages.

How it travels depends on the transport, and both are handled for you:

| Transport             | Where the namespace goes             |
| --------------------- | ------------------------------------ |
| `GET` (suggestions)   | `namespace` query param              |
| `POST` (result panel) | `namespace` inside the body `params` |

The option exists on both `QueryInputConfig` and `ResultsConfig`, so a header
input and its results page are limited independently - set it on both to keep
them consistent. In EDS, author a `namespace` row on the block and it feeds the
input and the panel(s) at once.
