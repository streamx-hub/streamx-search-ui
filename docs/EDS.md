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
