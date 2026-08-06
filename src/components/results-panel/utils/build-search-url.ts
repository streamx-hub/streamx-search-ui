import { withNamespaceParam } from "../../../helper";
import type { Results } from "../config/results-panel-config";

export const buildSearchUrl = (results: Results, pageNumber: number) => {
  const dataUrl = new URL(results.dataSources[0], window.location.href);

  dataUrl.searchParams.set("from", String((pageNumber - 1) * results.pageSize));
  dataUrl.searchParams.set("size", String(results.pageSize));

  // Only meaningful for GET - a POST request drops the query string and carries
  // the namespace in its body instead.
  return withNamespaceParam(dataUrl.toString(), results.namespace);
};
