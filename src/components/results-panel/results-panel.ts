import { onUrlChange, html } from "../../helper";
import { panelStates } from "./panel-state";
import { facetsParamName } from "./components/facets/utils/facet-param-name";
import { buildResultsForPage } from "./utils/build-page-results";
import {
  resolveConfig,
  type Results,
  type ResultsConfig,
} from "./config/results-panel-config";
import { readFacetsFromUrl } from "./components/facets/utils/read-facets-from-url";
import "./results-panel.css";

const addOnParamChangeAction = (
  resultsPanel: HTMLElement,
  results: Results,
  paramName: keyof Results,
) => {
  const queryStringParam = results[paramName];
  if (typeof queryStringParam !== "string") {
    console.error(`Invalid query string param type ${typeof queryStringParam}`);
    return;
  }
  let prevQueryStringParam =
    new URL(window.location.href).searchParams.get(queryStringParam) || "";

  const handleUrlChange = () => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get(queryStringParam) || "";

    if (prevQueryStringParam !== searchQuery) {
      buildResultsForPage(resultsPanel, results, 1, { resetFilters: true });
      prevQueryStringParam = searchQuery;
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
    addOnParamChangeAction(resultsPanel, results, 'queryParam');
    addOnParamChangeAction(resultsPanel, results, 'sortParam');

    return resultsPanel;
  } catch (error) {
    console.error(error);
    return results.renderers.error(results.labels);
  }
};
