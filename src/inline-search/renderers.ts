import { html, parseHighlight } from '../helper';
import type { OpenSearchItem } from '../types/results';

export function suggestionItem(item: OpenSearchItem): Element | undefined {
  const id = crypto.randomUUID();

  if (!item.highlight?.['payload.title']) {
    return;
  }

  const content = item.highlight['payload.title'].map((el) => parseHighlight(el))[0];

  return html`
    <a
      href="${item._id}"
      id="${id}"
      class="streamx-search-modal__suggestion-item"
    >
      <span>${content}</span>
    </a>
  ` as Element;
}

export function groupItem(item: OpenSearchItem): Element | undefined {
  if (!item._source.type) {
    return;
  }

  return html`
    <span class="streamx-search-modal__suggestion-category">
      ${item._source.type}
    </span>
  ` as Element;
}

export function clearIcon() {
  return '✕';
}

export function searchIcon() {
  return '🔍';
}
