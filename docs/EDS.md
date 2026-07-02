# Adobe Edge Delivery Services

## Overview

The library provides EDS integration helpers that decorate standard Edge Delivery Services blocks.

Each helper receives the block element and initializes the corresponding StreamX component.

## Available decorators

| Decorator                   | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `decorate-results-panel.js` | Decorates a block as a StreamX Search Results Panel.  |
| `decorate-search-tabs.js`   | Decorates a block as a StreamX Search Page with tabs. |
| `decorate-search-tab.js`    | Decorates a block as a StreamX Search Page with tab.  |

> **Note**
>
> The standalone Search Query component does not require an EDS-specific decorator. Use the standard `createSearchInput()` API instead.

## Example

### Results panel

#### blocks/search-results-panel/search-results-panel.js

```js
import decorateResultsPanel from "@streamx-ui/eds/decorate-results-panel.js";

export default function decorate(block) {
  decorateResultsPanel(block);
}
```

### Search tabs

#### blocks/search-tabs/search-tabs.js

```js
import decorateSearchTabs from "@streamx-ui/search/eds/streamx-search-tabs.js";

export default function decorate(block) {
  decorateSearchTabs(block, ".search-tab-selector");
}
```

#### blocks/search-tab/search-tab.js

```js
import decorateSearchTab from "@streamx-ui/search/eds/streamx-search-tab.js";

export default function decorate(block) {
  decorateSearchTab(block);
}
```

## Custom renderers

EDS decorators can receive custom renderers as the second or third argument, depending on the decorator.

Custom renderers are passed from the EDS block file, not from the block content.

### Results Panel

#### `blocks/stx-results-panel/stx-results-panel.js`

```js
import decorateResultsPanel from "../../scripts/search/eds/decorate-results-panel.js";

const renderers = {
  loader: () => document.createElement("span"),
  "item-page/eds-page": (item) => {
    const el = document.createElement("div");
    el.textContent = item._source.title;
    return el;
  },
};

export default function decorate(block) {
  decorateResultsPanel(block, renderers);
}
```

### Search Tabs

#### `blocks/stx-tabs/stx-tabs.js`

```js
import decorateSearchTabs from "../../scripts/search/eds/decorate-search-tabs.js";

const renderers = {
  searchIcon: () => "Search",
  clearIcon: () => "Clear",
  "item-page/eds-page": (item) => {
    const el = document.createElement("div");
    el.textContent = item._source.title;
    return el;
  },
};

export default function decorate(block) {
  decorateSearchTabs(block, ".stx-tab", renderers);
}
```

### Available renderer types

| Renderer         | Used by       | Description                                                                                                                                                                                                           |
| ---------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `searchIcon`     | Search input  | Replaces the default search icon.                                                                                                                                                                                     |
| `clearIcon`      | Search input  | Replaces the default clear icon.                                                                                                                                                                                      |
| `suggestionItem` | Search input  | Custom renderer for a suggestion item.                                                                                                                                                                                |
| `groupItem`      | Search input  | Custom renderer for a suggestion group item.                                                                                                                                                                          |
| `loader`         | Results panel | Custom loading state.                                                                                                                                                                                                 |
| `error`          | Results panel | Custom error state.                                                                                                                                                                                                   |
| `item-*`         | Results panel | Custom result item renderer. The renderer name should match the result type return by the API. The value comes from `item._source.type`. So for type `page/eds-page` the renderer name should be `item-page/eds-page` |

### Notes

Renderers should return an `HTMLElement`.

Renderer configuration is intentionally done in JavaScript, because EDS block content can only provide text values. For labels, use template variables in the block content. For custom markup, use renderers in the block JavaScript file.

## Standalone Search Query

Unlike the results panel and search tabs, the search query component does not require an EDS decorator.

Simply import the component from the standard StreamX entry point and mount it inside your block.

#### `blocks/search-query/search-query.js`

```js
import { createSearchInput } from "../../scripts/search/search-inline.js";

export default function decorate(block) {
  const search = createSearchInput({
    searchApiUrl: "/search",
    searchPageUrl: (query) => `/search?stx-search=${encodeURIComponent(query)}`,
  });

  block.append(search);
}
```

Custom renderers can be passed directly to `createSearchInput()` in the same way as described in the API documentation.
