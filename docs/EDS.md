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

### Using with a bundler

```js
import decorateResultsPanel from "streamx-search/eds/search-results-panel";
```

### Using directly in Adobe Edge Delivery Services

Copy the generated files to your EDS project, for example:

```js
scripts / search / streamx - search.css;
eds / search - results - panel.js;
```

Then import them by relative path:

```
  import decorateResultsPanel from '../../scripts/search/eds/search-results-panel.js';
```

## Creating blocks in an EDS document

Create blocks in your EDS document and provide their configuration as key-value pairs.

Each configuration row contains:

- The first column with the configuration property name.
- The second column with its value.

### Panel options

The Search Results Panel block and the Search Tab blocks render the same
results panel, so they accept the same panel options:

| Option                     | Default              | Description                                                                                                                                                                           |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageSize`                 | `10`                 | Number of results per page.                                                                                                                                                           |
| `dataSources`              | -                    | Results endpoint the panel POSTs to.                                                                                                                                                  |
| `requestId`                | -                    | Saved query/template id sent as the request body `id`.                                                                                                                                |
| `facetDepthLevel`          | `1`                  | Facet nesting depth. `1` is a flat facet; `3` requests `category_level0` → `1` → `2`. Requesting deeper than the index nests is safe - degenerate levels in the response are skipped. |
| `facetFilterField`         | `category_hierarchy` | Field the selected facet values are filtered against.                                                                                                                                 |
| `facetFieldPrefix`         | `category_level`     | Field name prefix for the facet levels.                                                                                                                                               |
| `facetPathSeparator`       | `>`                  | Separator between the levels of a hierarchical facet path.                                                                                                                            |
| `facetFieldSize`           | `20`                 | Maximum number of values requested per facet field.                                                                                                                                   |
| `debugMode`                | `false`              | `true` renders debug diagnostics in the results list (the "Missing renderer" notice for an unhandled result type). When unset/`false`, those rows are dropped entirely.               |
| `namespace`                | -                    | Limits results to one content namespace (e.g. `en`). Omit to search across all of them.                                                                                               |
| `paginationInfo`           | -                    | Label template, e.g. `Page {{currentPage}} of {{pageNumber}}`.                                                                                                                        |
| `totalResults`             | -                    | Label template, e.g. `{{totalCount}} results found`.                                                                                                                                  |
| `ariaPaginationGoToPage`   | -                    | ARIA label template, e.g. `Go to page {{pageNumber}}`.                                                                                                                                |
| `ariaPaginationNavigation` | -                    | ARIA label for the pagination navigation.                                                                                                                                             |

On a Search Results Panel block, author these options directly on the block.

On a search page with tabs they layer: options authored on the **Search Tabs**
block act as defaults for every tab, and each **Search Tab** block can override
any of them key by key (an empty cell falls through to the block-level value).
`dataSources` must be present at one of the two levels — usually per tab, since
pointing every tab at the same endpoint defeats the purpose of tabs.

> The results panel always uses `POST`, because facets and filtering travel in
> the request body. Facets render from whatever `aggregations` the endpoint
> returns, so no extra configuration is needed to display them. Selections are
> OR-ed within one facet tree and AND-ed across trees - see
> [Facets](API.md#facets) for the full semantics.

### Search Results Panel

| Search Results Panel     |                                        |
| ------------------------ | -------------------------------------- |
| searchApiUrl             | /api/search                            |
| minSearchLength          | 3                                      |
| pageSize                 | 10                                     |
| dataSources              | /api/results                           |
| queryParam               | query                                  |
| initialQuery             | popular topics                         |
| requestId                | eds-pages                              |
| facetDepthLevel          | 3                                      |
| facetFilterField         | category_hierarchy                     |
| facetFieldPrefix         | category_level                         |
| inputPlaceholder         | Search                                 |
| inputLabel               | Search                                 |
| clearButtonAria          | Clear search                           |
| searchButtonAria         | Submit search                          |
| paginationInfo           | Page {{currentPage}} of {{pageNumber}} |
| totalResults             | {{totalCount}} results found           |
| ariaPaginationGoToPage   | Go to page {{pageNumber}}              |
| ariaPaginationNavigation | Search results pagination              |

The block accepts every [panel option](#panel-options) plus the search-input
options shared with the Search Tabs block:

| Option          | Default | Description                                                                                   |
| --------------- | ------- | --------------------------------------------------------------------------------------------- |
| `queryParam`    | `query` | URL param holding the query. Use the same value on every block that takes part in the search. |
| `initialQuery`  | -       | Pre-fetched query offered in the dropdown while the input is focused and empty.               |
| `searchPageUrl` | -       | Send submissions to a separate search page instead of refreshing the panel below the input.   |
| `namespace`     | -       | Limits the input's suggestions to one content namespace. Omit to search all of them.          |

> **`searchPageUrl` changes where submitting goes.** Leave it unset (as in the
> example above) and the input refreshes the panel on the same page. Set it and
> the input navigates to that page instead, which is what you want for a header
> input but not for a block that renders its own results.

### Search Tabs

The Search Tabs block contains the configuration shared by the entire search page.

| Search Tabs      |                |
| ---------------- | -------------- |
| searchApiUrl     | /api/search    |
| minSearchLength  | 3              |
| queryParam       | query          |
| initialQuery     | popular topics |
| requestId        | eds-pages      |
| facetDepthLevel  | 3              |
| inputPlaceholder | Search         |
| inputLabel       | Search         |
| clearButtonAria  | Clear search   |
| searchButtonAria | Submit search  |

Any [panel option](#panel-options) set here acts as a default for every tab; a
Search Tab block can override each one individually.

`searchPageUrl` behaves as it does for the results panel: unset, submitting
refreshes the active tab in place; set, the input navigates to that page.

The active tab is mirrored in the URL (`stx-tab`), so a selected tab survives a
reload and can be linked to. The param is omitted while the first tab is active.

Each tab is configured using a separate Search Tab block.

### Shareable search URLs

Nothing to author - the blocks keep the whole search state in the URL, so a
reader can copy the address bar and the recipient sees the same search:

| Param        | Holds                                                               |
| ------------ | ------------------------------------------------------------------- |
| `query`      | the query, which also refills the input (rename via `queryParam`)   |
| `stx-tab`    | the active tab (Search Tabs only; absent on the first tab)          |
| `stx-facets` | the ticked facets; inside tabs it is per tab (`stx-facets-<tabId>`) |

Changing the query clears the facets. See
[URL Parameters](API.md#url-parameters) for the exact format.

### Search Tab

Add one Search Tab block for each results tab. Besides `id` and `displayName`,
a tab accepts every [panel option](#panel-options), overriding the block-level
default where both are set.

| Search Tab               |                                        |
| ------------------------ | -------------------------------------- |
| id                       | products                               |
| displayName              | Products                               |
| pageSize                 | 10                                     |
| dataSources              | /api/products                          |
| requestId                | eds-products                           |
| facetDepthLevel          | 2                                      |
| paginationInfo           | Page {{currentPage}} of {{pageNumber}} |
| totalResults             | {{totalCount}} results found           |
| ariaPaginationGoToPage   | Go to page {{pageNumber}}              |
| ariaPaginationNavigation | Products pagination                    |

For example, to create a search page with **Products** and **Articles** tabs, add:

1. One **Search Tabs** block with the shared search input configuration.
2. One **Search Tab** block with `id` set to `products`.
3. One **Search Tab** block with `id` set to `articles`.

The Search Tabs decorator reads the main block configuration and uses the Search Tab blocks to build the individual result tabs.

Dynamic labels can use template variables such as `{{currentPage}}`, `{{pageNumber}}`, and `{{totalCount}}`. The available variables depend on the selected label.
