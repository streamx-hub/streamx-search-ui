import type { PanelState } from "../../../panel-state.ts";

export interface FacetRenderContext {
  panelState: PanelState;
  pathSeparator: string;
  /**
   * Top-level aggregation field the whole tree belongs to. Every node in the
   * tree records its selection under this key, regardless of its depth.
   */
  treeField: string;
}
