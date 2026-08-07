import type { PanelState } from "../../../panel-state.ts";

export const addSelection = (
  panelState: PanelState,
  treeField: string,
  path: string,
) => {
  const values = panelState.selectedFilters.get(treeField) ?? new Set<string>();

  values.add(path);
  panelState.selectedFilters.set(treeField, values);
};

export const removeSelection = (
  panelState: PanelState,
  treeField: string,
  path: string,
) => {
  const values = panelState.selectedFilters.get(treeField);

  values?.delete(path);

  if (values?.size === 0) {
    panelState.selectedFilters.delete(treeField);
  }
};

/**
 * Drops every selection nested under `path`. Selecting a branch supersedes
 * anything selected beneath it, since the branch already matches those docs.
 */
export const clearDescendantSelections = (
  panelState: PanelState,
  treeField: string,
  path: string,
  separator: string,
) => {
  const values = panelState.selectedFilters.get(treeField);

  if (!values) {
    return;
  }

  const prefix = `${path}${separator}`;

  [...values].forEach((value) => {
    if (value.startsWith(prefix)) {
      values.delete(value);
    }
  });

  if (values.size === 0) {
    panelState.selectedFilters.delete(treeField);
  }
};

export const hasSelectedDescendant = (
  values: Set<string> | undefined,
  path: string,
  separator: string,
) => {
  if (!values) {
    return false;
  }

  const prefix = `${path}${separator}`;

  return [...values].some((value) => value.startsWith(prefix));
};
