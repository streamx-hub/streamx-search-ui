import { html, parseHighlight } from "../helper";
import type { OpenSearchItem } from "../types/open-search";

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
    <a href="${item._id}" id="${id}" class="stx-suggestion__item">
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
