import { mountQueryInput } from "../inline-search";
import {
  createResultsPanel as createPanel,
  type ResultsConfig,
} from "../components/results-panel/results-panel";
import type { QueryInputConfig } from "../types/config";
import { html } from "../helper";
import "../styles/common.css";

const createResultsPanel = (
  searchIputConfig: QueryInputConfig,
  resultPanelConfig: ResultsConfig,
) => {
  const searchInput = mountQueryInput(searchIputConfig);
  const panel = createPanel(resultPanelConfig);

  return html`
    <div class="stx-search-results-panel">${searchInput} ${panel}</div>
  ` as HTMLDivElement;
};

export { createResultsPanel };
