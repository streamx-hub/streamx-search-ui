# StreamX Search in an AEM Boilerplate (EDS + da.live) project

This guide adds [`@streamx-hub/search`](https://github.com/streamx-hub/streamx-search-ui) to a fresh repository created from [`adobe/aem-boilerplate`](https://github.com/adobe/aem-boilerplate) with content authored in [da.live](https://da.live).

When you are done you will have:

- A **search input in the header nav**, placed where authors put the `:search:` icon in the `/nav` document and configured by a **Search Config** table in that same document. Suggestions link straight to pages; pressing Enter opens the results page.
- A **`/search-results` page** with a **Search Results Panel** block (input, results, facets, pagination), configured by authors in da.live.

A working reference is [`streamx-lab/streamx-eds-search-demo-source`](https://github.com/streamx-lab/streamx-eds-search-demo-source).

---

## Prerequisites

| What                                                            | Why                                              |
| --------------------------------------------------------------- | ------------------------------------------------ |
| Repository created from `aem-boilerplate`, connected to da.live | Base project                                     |
| Node.js **>= 20.19**                                            | Required by `@streamx-hub/search`                |
| AEM CLI (`npm i -g @adobe/aem-cli`)                             | Local preview with `aem up`                      |
| StreamX **suggestions endpoint** (GET, reads `?query=`)         | Used by the nav input and the results page input |
| StreamX **results endpoint** (POST, OpenSearch-shaped response) | Used by the results panel                        |

The configuration tables below use the StreamX endpoint paths `/search/pages` (suggestions) and `/search/query/body` (results) on the same origin as the site.

---

## Install and vendor the library

EDS has no package manager at runtime. The browser loads files straight from the repository, so the library is installed with npm and the built files this project uses are **copied into `scripts/search/` and committed**. The installed version is recorded in `package.json`.

Do not edit files in `scripts/search/`. Every sync replaces them. Change texts and markup through renderers and labels in the block code instead.

### Install

```bash
npm i -D @streamx-hub/search
```

### Add the sync script

Create `scripts/sync-search.mjs`:

```js
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, normalize } from "node:path";

const source = "node_modules/@streamx-hub/search/dist";
const target = "scripts/search";

// Entry points this project imports. Everything else is found by following imports.
const entries = [
  "streamx-search-inline.js", // header: createSearchInput
  "eds/search-results-panel.js", // blocks/search-results-panel
];

// Loaded at runtime via URL, not via import, so it is listed explicitly.
const assets = ["streamx-search.css"];

const importPattern = /(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;

function collect(file, found) {
  if (found.has(file)) return;

  found.add(file);

  const code = readFileSync(join(source, file), "utf8");

  [...code.matchAll(importPattern)].forEach(([, spec]) => {
    collect(normalize(join(dirname(file), spec)), found);
  });
}

const files = new Set();

entries.forEach((entry) => collect(entry, files));
assets.forEach((asset) => files.add(asset));

// Chunk names are content-hashed, so start clean to avoid leaving old chunks behind.
rmSync(target, { recursive: true, force: true });

[...files].sort().forEach((file) => {
  mkdirSync(dirname(join(target, file)), { recursive: true });
  copyFileSync(join(source, file), join(target, file));

  console.log(`copied ${file}`);
});

// Placeholder files for the Search Config block in the nav. The header reads and removes
// the block, but EDS still requests a script and a stylesheet for it.
// Created only when missing, so edits to them are never overwritten.
const placeholders = {
  "blocks/search-config/search-config.js": `// Search Config is read and removed by blocks/header/header.js.
// This empty decorator only exists so EDS finds a file for the block.
export default function decorate() {}
`,
  "blocks/search-config/search-config.css": `/* Search Config renders nothing. This file only exists so EDS finds a stylesheet for the block. */
`,
};

Object.entries(placeholders).forEach(([file, content]) => {
  if (existsSync(file)) return;

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);

  console.log(`created ${file}`);
});
```

The script copies only what this project loads: the two entry points, the chunks they import (found by following `import` statements, since chunk names are hashed and change between versions) and the stylesheet. Not copied: the search tabs files (`streamx-search-tabs.js`, `search-tabs-<hash>.js`, `eds/search-tabs.js`, `eds/search-tab.js`), the non-EDS `streamx-search-results-panel.js` and the package `index.js`, which pulls in everything.

The script also creates the two placeholder files for the **Search Config** block, `blocks/search-config/search-config.js` and `blocks/search-config/search-config.css` (see Search Config block below). They are written only when missing, so later runs never overwrite them.

If you later use another component, add its entry to `entries`, for example `'eds/search-tabs.js'` and `'eds/search-tab.js'` for a tabbed search page, and run the script again.

### Add the npm script

In `package.json`, add `sync:search` to the existing `scripts` object:

```json
"scripts": {
  "lint:js": "eslint .",
  "lint:css": "stylelint \"blocks/**/*.css\" \"styles/*.css\"",
  "lint": "npm run lint:js && npm run lint:css",
  "lint:fix": "npm run lint:js -- --fix && npm run lint:css -- --fix",
  "sync:search": "node scripts/sync-search.mjs"
}
```

### Run it

```bash
npm run sync:search
```

Result (hashes differ per version):

```
scripts/search/
  streamx-search.css
  streamx-search-inline.js
  common-<hash>.js
  modal-<hash>.js
  eds-helper-<hash>.js
  results-panel-<hash>.js
  search-results-panel-<hash>.js
  eds/
    search-results-panel.js
```

plus, on the first run:

```
blocks/search-config/
  search-config.js
  search-config.css
```

Keep this layout. The results panel decorator loads `../streamx-search.css` relative to `eds/`, and the nav search loads `scripts/search/streamx-search.css`.

### Commit

```bash
git add package.json package-lock.json scripts/sync-search.mjs scripts/search blocks/search-config
git commit -m "vendor @streamx-hub/search"
```

---

## Search Config block

The nav search is configured by a **Search Config** table in the `/nav` document. The header reads it and removes it, so it never renders. EDS still requests a script and a stylesheet for every block it finds, so the block needs two placeholder files. The sync script already created them in `blocks/search-config/`; there is nothing to add here.

---

## Search input in the header nav

The boilerplate header block (`blocks/header/header.js`) loads the `/nav` document and splits it into three sections: `nav-brand`, `nav-sections` and `nav-tools`. The header change below replaces the `:search:` icon in `nav-tools` with an empty mount point and loads `scripts/lazy.js`, which creates the input there from the Search Config. `lazy.js` and the search library are loaded only when the nav contains search, and the header does not wait for them.

If the nav has no Search Config or no `:search:` icon, nothing is added and nothing is logged.

### Add two functions to `blocks/header/header.js`

Paste this directly above the `/** loads and decorates the header, mainly the nav */` comment:

```js
/**
 * Reads an authored key/value block (two columns per row) into an object.
 * @param {Element} block The block element
 * @returns {Object} The parsed config
 */
function parseSearchConfig(block) {
  const config = {};

  block.querySelectorAll(":scope > div").forEach((row) => {
    const [keyEl, valueEl] = row.querySelectorAll(":scope > div");
    const key = keyEl?.textContent?.trim();
    const value = valueEl?.textContent?.trim();

    if (key && value) config[key] = value;
  });

  return config;
}

/**
 * Replaces the :search: icon in the nav tools with a mount point and loads
 * scripts/lazy.js, which creates the StreamX search input from the Search Config.
 * @param {Element} nav The nav element
 */
function decorateSearch(nav) {
  const configBlock = nav.querySelector(".search-config");
  if (!configBlock) return;

  const config = parseSearchConfig(configBlock);

  // The config table is not content, so it is removed from the nav.
  (configBlock.closest(".search-config-wrapper") || configBlock).remove();

  const searchIcon = nav.querySelector(".nav-tools .icon-search");
  if (!searchIcon) return;

  const mount = document.createElement("div");
  mount.className = "nav-search";
  (searchIcon.closest("p") || searchIcon).replaceWith(mount);

  import("../../scripts/lazy.js").then(({ default: loadNavSearch }) =>
    loadNavSearch(mount, config),
  );
}
```

### Call it inside `decorate`

In `decorate(block)`, find:

```js
const navWrapper = document.createElement("div");
navWrapper.className = "nav-wrapper";
```

and insert the call directly above it:

```js
decorateSearch(nav);

const navWrapper = document.createElement("div");
navWrapper.className = "nav-wrapper";
```

The call must come after the `nav-brand / nav-sections / nav-tools` classes are assigned, so `.nav-tools` can be found.

### Create `scripts/lazy.js`

```js
import { loadCSS } from "./aem.js";

/**
 * Creates the StreamX search input in the nav mount point prepared by the header.
 * @param {Element} mount The nav search mount point
 * @param {Object} config The Search Config rows authored in the nav
 */
export default async function loadNavSearch(mount, config) {
  if (!config.searchApiUrl) {
    // eslint-disable-next-line no-console
    console.error('Search Config in the nav is missing "searchApiUrl"');
    return;
  }

  // createSearchInput does not load the stylesheet itself.
  loadCSS(`${window.hlx.codeBasePath}/scripts/search/streamx-search.css`);

  const { createSearchInput } =
    await import("./search/streamx-search-inline.js");

  const queryParam = config.queryParam || "query";

  createSearchInput(
    {
      searchApiUrl: config.searchApiUrl,
      searchPageUrl: config.searchPageUrl
        ? (query) =>
            `${config.searchPageUrl}?${queryParam}=${encodeURIComponent(query)}`
        : undefined,
      queryParam,
      minSearchLength: Number(config.minSearchLength) || 3,
      namespace: config.namespace || undefined,
      showSearchButton: false,
      suggestionsAsLinks: config.suggestionsAsLinks === "true",
      labels: {
        inputPlaceholder: config.inputPlaceholder || undefined,
        inputLabel: config.inputLabel || undefined,
        clearButtonAria: config.clearButtonAria || undefined,
      },
    },
    mount,
  );
}
```

What it does:

- Receives the mount point and the Search Config from the header. If `searchApiUrl` is missing, it logs one error and stops.
- On the results page itself (`searchPageUrl`), it removes the mount: that page already has an input from the Search Results Panel.
- Loads the stylesheet, because `createSearchInput` does not load it on its own.
- Creates the input with `showSearchButton: false` (Enter submits to `searchPageUrl`). With `suggestionsAsLinks` set to `true`, a suggestion opens its page instead of submitting its text as a query.

`minSearchLength` falls back to 3, the same default as the Search Results Panel, so both inputs start suggesting at the same length.

### Optional: input stacking in `styles/styles.css`

The library puts the search input on `z-index: 1000` by default. To lower it, add this inside the existing `:root { ... }` rule:

```css
/* stacking of the StreamX search input */
--stx-z-query-input: 1;
```

---

## Search Results Panel block

Create the block folder `blocks/search-results-panel/`. The folder and file names must match the block name authored in da.live (**Search Results Panel** → `search-results-panel`).

### `blocks/search-results-panel/search-results-panel.js`

```js
/* eslint-disable no-underscore-dangle */
import decorateResultsPanel from "../../scripts/search/eds/search-results-panel.js";
import { getHitUrl } from "../../scripts/search/streamx-search-inline.js";

/**
 * Creates an element and sets its text. Text is never parsed as HTML,
 * so indexed content cannot inject markup.
 */
function el(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = String(text);

  return element;
}

/**
 * Highlighted snippets contain <em> tags around matches. Keep those, drop everything else.
 */
function highlightedText(className, content) {
  const raw = (Array.isArray(content) ? content.join(" ") : (content ?? ""))
    .replace(/\s+/g, " ")
    .trim();

  const span = el("span", className);

  raw.split(/(<em>.*?<\/em>)/g).forEach((part) => {
    const match = part.match(/^<em>(.*?)<\/em>$/);

    span.append(
      match ? el("em", null, match[1]) : document.createTextNode(part),
    );
  });

  return span;
}

let suggestionCount = 0;

function suggestionItem(item) {
  const title =
    item.highlight?.["payload.title"] || item._source.payload.title || "";
  const link = el("a", "stx-suggestion__item search-suggestion");

  suggestionCount += 1;

  // The input points aria-activedescendant at this id during keyboard navigation.
  link.id = `search-suggestion-${suggestionCount}`;
  link.href = getHitUrl(item);

  link.append(highlightedText("search-suggestion-title", title));

  return link;
}

function resultItem(item) {
  const { title, fields } = item._source.payload ?? {};
  const { author, date, description } = fields ?? {};

  const article = el("article", "search-result");
  const link = el("a", "search-result-title", title ?? "");
  link.href = getHitUrl(item);
  article.append(link);

  if (description)
    article.append(el("p", "search-result-description", description));

  const meta = el("div", "search-result-meta");

  if (author) meta.append(el("span", null, author));
  if (date) meta.append(el("span", null, date));

  if (meta.children.length) article.append(meta);

  return article;
}

function error() {
  const box = el("div", "stx-results-panel__error");

  box.append(
    el("span", "stx-results-panel__error-heading", "Something went wrong."),
    el("span", "stx-results-panel__error-text", "Please try again later"),
  );

  return box;
}

const renderers = {
  // Key is `item-` + the result's `_source.type`.
  "item-page/eds": resultItem,
  suggestionItem,
  error,
};

const callbacks = {
  // Submit the suggestion title, not the title plus snippet text.
  suggestionItemSubmitValue: (item) =>
    item
      .closest(".search-suggestion")
      ?.querySelector(".search-suggestion-title")?.textContent ?? "",
};

export default function decorate(block) {
  decorateResultsPanel(block, renderers, callbacks);
}
```

What it does:

- Passes custom **renderers** to the library decorator: one for results of type `page/eds` (`item-page/eds`), one for suggestions, and one for the error state.
- Builds all markup with `textContent`, so titles, descriptions and authors from the index are shown as text and cannot inject HTML. Only the `<em>` tags the search engine adds around matches in suggestion snippets are kept.
- Uses `getHitUrl` for links, which returns absolute paths (`/blog/post`), so links work wherever the results page lives.
- The **`suggestionItemSubmitValue`** callback submits only the suggestion title when a suggestion is chosen, not the title plus snippet text.

The renderer key must match the result's `_source.type` from your index, prefixed with `item-`. Results whose type has no renderer are dropped. Add the `debugMode` row with `true` to the block to see a "Missing renderer" notice for them instead.

`getHitUrl` is imported from `streamx-search-inline.js`, which the sync script already copies. It is also exported from `streamx-search-results-panel.js`, but that file is not copied.

### `blocks/search-results-panel/search-results-panel.css`

```css
.search-results-panel .search-result-title {
  color: var(--link-color);
  font-size: var(--body-font-size-m);
  font-weight: 700;
  text-decoration: none;
}

.search-results-panel .search-result-meta {
  display: flex;
  gap: 16px;
  color: var(--dark-color);
  font-size: var(--body-font-size-xs);
}

.search-suggestion {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-suggestion-content {
  font-size: var(--body-font-size-xs);
}

.search-suggestion-content em {
  font-style: normal;
  font-weight: 700;
}
```

### Commit and push

```bash
git add blocks/header blocks/search-results-panel scripts/lazy.js styles/styles.css
git commit -m "StreamX search in the nav and search results page"
git push
```

---

## Author the nav in da.live

1. Open `https://da.live/#/<org>/<repo>` and open the `nav` document.
2. Go to the **third section** (the tools section, after the second section break). If it does not already contain the search icon, type `:search:` on its own line. This marks where the input goes.
3. Directly below it, in the same section, add this table. Copy the table into the document, then merge the two cells of the first row:

| Search Config      |                 |
| ------------------ | --------------- |
| searchApiUrl       | /search/pages   |
| searchPageUrl      | /search-results |
| suggestionsAsLinks | true            |

This is the minimal configuration. Required: `searchApiUrl`. Without `searchPageUrl`, pressing Enter in the nav input only adds `?query=…` to the current URL and stays on the page. Without `suggestionsAsLinks`, clicking a suggestion submits its text as a query.

Optional rows: `queryParam` (default `query`), `minSearchLength` (default 3), `namespace`, `inputPlaceholder`, `inputLabel`, `clearButtonAria`.

4. **Preview**, then **Publish**.

---

## Create the `search-results` page in da.live

1. Create a new **document** in the root folder named `search-results`. Its URL becomes `/search-results`, which must match `searchPageUrl` in the Search Config.
2. Optionally add a heading, e.g. `Search`.
3. Add this table. Copy the table into the document, then merge the two cells of the first row:

| Search Results Panel |                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| searchApiUrl         | /search/pages                                                                                                                                             |
| submitInPlace        | true                                                                                                                                                      |
| dataSources          | /search/query/body                                                                                                                                        |
| requestId            | eds-pages                                                                                                                                                 |
| facetFields          | architecture, audience, automation, benefit, business, capability, category, content, data, feature, operations, scalability, technology, topic, use-case |

This is the minimal configuration. Required: `searchApiUrl` (the block renders a red error without it) and `dataSources`. `requestId` is sent as the request body `id`; `facetFields` lists the facet trees shown next to the results.

If you set `queryParam` or `minSearchLength`, use the same values as in the Search Config. A different `queryParam` opens the results page with an empty query.

Do **not** add a `searchPageUrl` row on this page. Leaving it unset makes the panel's own input refresh the results in place.

4. **Preview**, then **Publish**.

The full list of block options (facets, sorting, namespace, debug mode) is in the library's [`docs/EDS.md`](https://github.com/streamx-hub/streamx-search-ui/blob/main/docs/EDS.md#creating-blocks-in-an-eds-document).

---

## Verify

### Locally

```bash
aem up
```

1. Open `http://localhost:3000/`. The nav shows the search input where the `:search:` icon was, and no Search Config table is visible.
2. Type at least 3 characters: suggestions load from the Search Config `searchApiUrl` (DevTools → Network: `GET …/search/pages?query=…`). Clicking a suggestion opens that page.
3. Type a term and press Enter: the browser goes to `/search-results?query=<term>`.
4. On `/search-results` the nav input is gone, the panel's input is prefilled and results load (`POST <dataSources>`).

`aem up` serves code from your working copy and content from `*.aem.page`, so `nav` and `search-results` must be **previewed** in da.live first.

### On aem.page / aem.live

After pushing to `main`, repeat the checks on `https://main--<repo>--<org>.aem.page/`.

---

## Troubleshooting

| Symptom                                                           | Cause                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| No input in the nav, no error                                     | The `nav` document has no Search Config table, or no `:search:` icon in the third section               |
| Console: _Search Config in the nav is missing "searchApiUrl"_     | `searchApiUrl` row missing or misspelled in the Search Config                                           |
| Search Config table visible in the nav                            | `decorateSearch(nav)` call missing in `header.js`                                                       |
| Nav input renders unstyled                                        | `scripts/search/streamx-search.css` not committed                                                       |
| `Failed to fetch dynamically imported module …/scripts/search/…`  | `npm run sync:search` not run, or `scripts/search/` not committed                                       |
| Enter in the nav input stays on the page and only changes the URL | `searchPageUrl` missing in the Search Config                                                            |
| Results page opens but the query is empty                         | `queryParam` differs between the Search Config and the Search Results Panel                             |
| Red box: _The Results panel block requires searchApiUrl_          | `searchApiUrl` row missing or misspelled on the results page                                            |
| Results panel shows a count but no result items                   | No renderer for the results' `_source.type`; turn on `debugMode` to see which type is missing           |
| Block content shows as a plain table                              | Block name in da.live does not resolve to the block folder name, or the block folder/files are misnamed |
| Suggestions request never fires                                   | Fewer characters than `minSearchLength` (default 3)                                                     |
