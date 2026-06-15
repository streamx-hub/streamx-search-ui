import type { ModalConfig, ModalLabels } from '../types/config';
import { suggestionItem, groupItem, clearIcon, searchIcon } from './renderers';

const DEFAULT_LABELS: Required<ModalLabels> = {
  inputPlaceholder: 'Search',
  inputLabel: 'Search',
  clearButtonAria: 'Clear search input',
  searchButtonAria: 'Go to search page'
};

const DEFAULT_RENDERERS: Required<ModalConfig['renderers']> = {
  suggestionItem,
  groupItem,
  clearIcon,
  searchIcon,
};

const DEFAULT_CONFIG = {
  minSearchLength: 3,
  groupByCategory: true,
  useNonModal: false,
  labels: DEFAULT_LABELS,
  renderers: DEFAULT_RENDERERS,
};

export default DEFAULT_CONFIG;
