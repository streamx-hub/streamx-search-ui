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
  --stx-color-background: #ffffff;
  --stx-color-border: #e5e7eb;
}
```

Changes are applied automatically to all StreamX Search UI components.

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
