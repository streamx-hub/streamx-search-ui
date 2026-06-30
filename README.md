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
import { createSearchInModal } from "./dist/streamx-search-inline.js";
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

## Which files should I import?

### Inline Search

Use for header search, navigation search, autocomplete input or modal search.

```html
<script type="module">
  import {
    createSearchInput,
    createSearchInModal,
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
  import { createSearchInModal } from "./dist/streamx-search-inline.js";

  createSearchInModal({
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

| Bundle               | Export                  | Description                                   |
| -------------------- | ----------------------- | --------------------------------------------- |
| Inline Search        | `createSearchInput()`   | Creates a standalone search input.            |
| Inline Search        | `createSearchInModal()` | Creates a modal search.                       |
| Search Tabs          | `createSearchTabs()`    | Creates a search page with tabs.              |
| Search Results Panel | `createResultsPanel()`  | Creates a search input with one result panel. |

See [`API.md`](./API.md) for the full API reference.

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

The current search query is read from the `stx-search` URL parameter.

---

## Accessibility

The default components include accessible labels, keyboard navigation, modal behavior, pagination labels and screen reader announcements.

---

## Next Documents

- [`API.md`](./API.md) — full public API reference
- `CUSTOMIZATION.md` — custom labels, renderers and themes
- `EXAMPLES.md` — complete integration examples
