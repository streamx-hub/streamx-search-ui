import { onUrlChange, html } from "../../helper";
import { panelStates } from "./panel-state";
import { facetsParamName } from "./components/facets";
import { buildResultsForPage } from "./utils/build-page-results";
import {
  resolveConfig,
  type Results,
  type ResultsConfig,
} from "./config/results-panel-config";
import { readFacetsFromUrl } from "./utils/read-facets-from-url";
import "./results-panel.css";

const addOnSearchParamChangeAction = (
  resultsPanel: HTMLElement,
  results: Results,
) => {
  const queryParam = results.queryParam;
  let prevSearchParam =
    new URL(window.location.href).searchParams.get(queryParam) || "";

  const handleUrlChange = () => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get(queryParam) || "";

    if (prevSearchParam !== searchQuery) {
      buildResultsForPage(resultsPanel, results, 1, { resetFilters: true });
      prevSearchParam = searchQuery;
    }
  };

  window.addEventListener("popstate", () => {
    handleUrlChange();
  });

  onUrlChange(() => {
    handleUrlChange();
  });
};

export const createResultsPanel = (resultsConfig: ResultsConfig | Results) => {
  const results = resolveConfig(resultsConfig);

  const resultsPanel = html`
    <div class="stx-results-panel">${results.renderers.loader()}</div>
  ` as HTMLDivElement;

  panelStates.set(resultsPanel, {
    currentPage: 1,
    // Seeded from the URL so a shared/deep-linked selection is applied to the
    // first request and reflected in the checkboxes once facets render.
    selectedFilters: readFacetsFromUrl(facetsParamName(results)),
    facetsElement: null,
    resultsContainer: null,
    request: null,
  });

  try {
    buildResultsForPage(resultsPanel, results, 1);
    addOnSearchParamChangeAction(resultsPanel, results);

    return resultsPanel;
  } catch (error) {
    console.error(error);
    return results.renderers.error(results.labels);
  }
};
