import type { OpenSearchResponse } from "./types/open-search";

/**
 * A tagged template function that parses an HTML string into DOM elements.
 *
 * It supports embedding strings, numbers, single DOM elements (`HTMLElement`),
 * as well as collections of elements (`Array` or `NodeList`).
 *
 * @example
 * // 1. Single element
 * const element = html`<div class="box">Hello World</div>`;
 *
 * @example
 * // 2. Nested elements and arrays
 * const listItems = [html`<li>Item 1</li>`, html`<li>Item 2</li>`];
 * const list = html`<ul>${listItems}</ul>`;
 *
 * @param {TemplateStringsArray} strings - The array of literal string segments.
 * @param {...unknown[]} values - The dynamic expressions interpolated into the template.
 * @returns {Element | HTMLCollection} A single `Element` if the template contains exactly
 * one top-level root element, otherwise an `HTMLCollection` of all root-level elements.
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Element | HTMLCollection {
  const template = document.createElement("template");

  template.innerHTML = strings.reduce((acc: string, str: string, i: number) => {
    const val = values[i];
    if (
      val instanceof HTMLElement ||
      val instanceof Array ||
      val instanceof NodeList
    ) {
      return `${acc}${str}<template data-html-id="value-${i}"></template>`;
    }

    return acc + str + (val ?? "");
  }, "");

  template.content.querySelectorAll("[data-html-id]").forEach((el) => {
    const htmlId = (el as HTMLElement).dataset.htmlId;
    if (!htmlId) return;

    const idString = htmlId.split("-")[1];
    if (!idString) return;

    const numberFromID = parseInt(idString, 10);
    const targetValue = values[numberFromID];

    if (targetValue instanceof Array) {
      el.replaceWith(...(targetValue as (Node | string)[]));
      return;
    }

    if (targetValue instanceof NodeList) {
      el.replaceWith(...Array.from(targetValue));
      return;
    }

    if (targetValue instanceof HTMLElement) {
      el.replaceWith(targetValue);
      return;
    }

    console.error("Case not handled for", el);
  });

  const { children } = template.content;

  return children.length === 1 ? children[0] : children;
}

/**
 * Captures the currently focused element and returns a function to restore focus to it.
 */
export function trapFocus() {
  const lastFocused = document.activeElement;

  return () => {
    if (
      lastFocused instanceof HTMLElement &&
      document.body.contains(lastFocused)
    ) {
      lastFocused.focus();
    } else {
      document.body.focus();
    }
  };
}

/**
 * Decodes HTML entities into their corresponding characters
 * using a temporary <textarea> element.
 *
 * This approach leverages the browser's built-in HTML parser
 * to convert entities like &amp;, &lt;, &#169;, etc. into
 * their decoded character equivalents.
 *
 * ⚠️ Security note:
 * This is safe in this context because the textarea element
 * is never attached to the DOM. It is used only as an internal
 * parsing utility. However, it still relies on innerHTML
 * parsing behavior.
 *
 * @param {string} text - String containing HTML entities.
 * @returns {string} Decoded string with HTML entities resolved.
 *
 * @example
 * decodeEntities("Tom &amp; Jerry") // "Tom & Jerry"
 * decodeEntities("&#169; &lt;test&gt;") // "© <test>"
 */
function decodeEntities(text: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;

  return textarea.value;
}

/**
 * Parses OpenSearch/Elasticsearch highlight strings containing <em> tags
 * and returns an array of text and DOM nodes.
 *
 * Only <em> and </em> tags are supported. All other HTML is treated as text.
 *
 * Workflow:
 * - Splits input by <em> and </em>
 * - Decodes HTML entities in all text parts
 * - Wraps content inside <em> elements as DOM nodes
 *
 * @param {string} text - Highlight string (e.g. from OpenSearch highlight field)
 * @returns {(string|HTMLElement)[]} Array of strings and <em> DOM elements
 *
 * @example
 * parseHighlight("Test &amp; <em>Lorem</em> ipsum")
 * // [
 * //   "Test & ",
 * //   <em>Lorem</em>,
 * //   " ipsum"
 * // ]
 *
 * @example
 * parseHighlight("A <em>B &amp; C</em> D")
 * // [
 * //   "A ",
 * //   <em>B & C</em>,
 * //   " D"
 * // ]
 */
export function parseHighlight(text: string) {
  const parts = text.split(/(<\/?em>)/);

  const result = [];
  let insideEm = false;

  for (const part of parts) {
    if (!part) continue;

    if (part === "<em>") {
      insideEm = true;
      continue;
    }

    if (part === "</em>") {
      insideEm = false;
      continue;
    }

    const decoded = decodeEntities(part);

    if (insideEm) {
      const em = document.createElement("em");
      em.textContent = decoded;
      result.push(em);
    } else {
      result.push(decoded);
    }
  }

  return result;
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export const fetchSearchResults = async (url: string, signal?: AbortSignal) => {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Fetch data error: ${response.status}`);
  }

  return response.json() as Promise<OpenSearchResponse>;
};

/**
 * Creates a placeholder that is replaced with the built element on the first `build()` call.
 *
 * @param buildFunction Function creating the element.
 */
export const lazyBuildComponent = (buildFunction: () => HTMLElement) => {
  let isBuild = false;
  const placeholderEl = html`
    <div data-lazy-build="true"></div>
  ` as HTMLDivElement;

  const build = () => {
    if (isBuild) {
      return;
    }

    const newEl = buildFunction();

    placeholderEl.replaceWith(newEl);
    isBuild = true;
  };

  return {
    element: placeholderEl,
    build,
  };
};
