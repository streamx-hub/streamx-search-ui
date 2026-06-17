import { html } from '../../helper.ts';
import type { QueryInput } from '../../types/query-input.ts';
import type {
  OpenSearchItem,
  OpenSearchResponse,
} from '../../types/results.ts';

const renderSuggestionListItem = (
  item: OpenSearchItem & { isFirstInGroup?: boolean },
  config: QueryInput,
) => {
  const elements = [];

  if (item.isFirstInGroup) {
    const groupItem = config.renderers.groupItem(item);

    if (groupItem) {
      elements.push(groupItem);
    }
  }

  const suggestionItem = config.renderers.suggestionItem(item);

  if (suggestionItem) {
    elements.push(suggestionItem);
  }

  return elements;
};

export function orderByTypeWithFlags(items: OpenSearchItem[]) {
  const groups = new Map<string, OpenSearchItem[]>();
  const order: string[] = [];

  // grouping and remembering the type order
  for (const item of items) {
    const type = item._source.type ?? '__no_type__';

    if (!groups.has(type)) {
      groups.set(type, []);
      order.push(type);
    }

    groups.get(type)!.push(item);
  }

  const result: (OpenSearchItem & { isFirstInGroup: boolean })[] = [];

  for (const type of order) {
    const group = groups.get(type)!;

    group.forEach((item, index) => {
      result.push({
        ...item,
        isFirstInGroup: index === 0,
      });
    });
  }

  return result;
}

const createSuggestions = (
  response: OpenSearchResponse,
  config: QueryInput,
) => {
  let data = response.hits.hits;

  if (config.groupByCategory) {
    data = orderByTypeWithFlags(response.hits.hits);
  }

  const element = html`
    <div class="stx-suggestions-wrapper">
      ${data
        .map((el) => {
          return renderSuggestionListItem(el, config);
        })
        .flat()}
    </div>
  `;

  return {
    element,
  };
};

export default createSuggestions;
