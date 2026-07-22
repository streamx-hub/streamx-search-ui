import { html, parseHighlight } from "../helper";
import type { OpenSearchItem } from "../types/open-search";

/**
 * Resolves the destination URL of a hit from its `_id`.
 *
 * The index namespaces `_id` (e.g. `en:/en/blog/post`), so the `${namespace}:`
 * prefix has to be stripped to get a usable URL. Hits without a namespace — or
 * whose `_id` does not carry that exact prefix — are returned unchanged.
 *
 * @example
 * getHitUrl({ _id: "en:/en/blog/post", _source: { namespace: "en" } })
 * // "/en/blog/post"
 *
 * @example
 * getHitUrl({ _id: "/index.html", _source: { namespace: null } })
 * // "/index.html"
 */
export function getHitUrl(item: OpenSearchItem) {
  const id = item?._id ?? "";
  const namespace = item?._source?.namespace;

  if (namespace && id.startsWith(`${namespace}:`)) {
    return id.slice(namespace.length + 1);
  }

  return id;
}

export function suggestionItem(item: OpenSearchItem): Element | undefined {
  const id = crypto.randomUUID();
  const data = [];

  if (item.highlight?.["payload.title"]) {
    data.push(...item.highlight["payload.title"]);
  }

  if (item.highlight?.["payload.content"]) {
    data.push(...item.highlight["payload.content"]);
  }

  const content = data.map((el) => parseHighlight(el))[0];

  return html`
    <a href="${getHitUrl(item)}" id="${id}" class="stx-suggestion__item">
      <span>${content}</span>
    </a>
  ` as Element;
}

export function groupItem(item: OpenSearchItem): Element | undefined {
  if (!item._source.type) {
    return;
  }

  return html`
    <span class="stx-suggestion__category"> ${item._source.type} </span>
  ` as Element;
}

export function clearIcon() {
  return "✕";
}

export function searchIcon() {
  return "🔍";
}
