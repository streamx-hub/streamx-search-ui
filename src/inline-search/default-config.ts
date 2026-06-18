import type { QueryInputLabels, QueryInputRenderers } from '../types/query-input';
import { suggestionItem, groupItem, clearIcon, searchIcon } from '../renderers/renderers';

const DEFAULT_LABELS: Required<QueryInputLabels> = {
  inputPlaceholder: 'Search',
  inputLabel: 'Search',
  clearButtonAria: 'Clear search input',
  searchButtonAria: 'Go to search page'
};

const DEFAULT_RENDERERS: Required<QueryInputRenderers> = {
  suggestionItem,
  groupItem,
  clearIcon,
  searchIcon,
};

const DEFAULT_CONFIG = {
  input: {
    minSearchLength: 3,
    groupByCategory: true,
    labels: DEFAULT_LABELS,
    renderers: DEFAULT_RENDERERS,
  },
  useNonModal: false,
  analytics: () => {}
};

export default DEFAULT_CONFIG;
