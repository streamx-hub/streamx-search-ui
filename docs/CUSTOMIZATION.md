# StreamX Search UI Customization

This document describes the recommended ways to customize the appearance of StreamX Search UI components.

---

# Table of Contents

- Styling
  - CSS Variables
  - CSS Classes
  - Overriding Styles
  - Best Practices

---

# Styling

StreamX Search UI is designed to be easily customizable without modifying the library source code.

The recommended customization methods are:

- CSS variables
- Component CSS classes
- Your own stylesheet loaded after the library stylesheet

---

# CSS Variables

The library uses CSS custom properties for common visual settings such as colors, borders and shadows.

Override the variables after importing the library stylesheet.

## Example

```css
:root {
  --stx-color-primary: #2563eb;
  --stx-color-text: #222;
  --stx-color-text-query-input: #222;
  --stx-color-background: #ffffff;
  --stx-color-border: #e5e7eb;
}
```

Changes are applied automatically to all StreamX Search UI components.

## Stacking (`--stx-z-query-input`)

The search input creates its own stacking context so its suggestions dropdown
paints above the content below it. The default (`1000`) is deliberately high, but
it can be too high for a host page that has its own layered chrome:

```css
:root {
  --stx-z-query-input: 10;
}
```

Lower it when a page holds **two** inputs - for example a site-header search plus
a results-panel search - and the header sits in a stacking context of its own
(a fixed header with a `z-index`). At the default, the results panel's input
out-stacks the whole header, so the header dropdown opens _behind_ the page
content. Any value that stays above the page content but below the header fixes
it.

---

# CSS Classes

All component classes use the `stx-` prefix to minimize conflicts with existing page styles.

## Main Components

| Class Prefix        | Component            |
| ------------------- | -------------------- |
| `stx-query-input`   | Search input         |
| `stx-modal`         | Search modal         |
| `stx-results-panel` | Search results panel |
| `stx-tabs`          | Search tabs          |

## Example

```html
<div class="stx-query-input">...</div>
```

The library does not apply global styles to native HTML elements such as `input`, `button`, `ul` or `div`. All styling is scoped to StreamX Search UI component classes.

## Result rows

A result row is a plain `<li class="stx-results-panel__results-item">` holding
whatever the `item-*` renderer returned - the library adds no markup of its own
inside it. Anything beyond the row itself (links, thumbnails, layout) comes from
your renderer, so style it with your own classes.

---

# Overriding Styles

The recommended approach is to load your own stylesheet after the library stylesheet.

## Example

```html
<link rel="stylesheet" href="streamx-search-tabs.css" />
<link rel="stylesheet" href="custom-theme.css" />
```

Override only the classes you want to customize.

```css
.stx-query-input {
  border-radius: 999px;
}

.stx-query-input__input {
  font-size: 16px;
}

.stx-results-panel {
  border: none;
}
```

Avoid modifying the distributed library CSS directly, as your changes will be lost when updating the library.
