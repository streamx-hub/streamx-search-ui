import { creatQueryInput } from "../components/query-input/query-input";
import { html } from "../helper";
import DEFAULT_CONFIG from "../inline-search/default-config";
import type { QueryInputConfig } from "../types/config";
import type { QueryInput } from "../types/query-input";

const configureTextInput = (mountPoint: Element, customConfig: QueryInputConfig) => {
  const inputOption: QueryInput = {
    ...DEFAULT_CONFIG.input,
    ...customConfig,
    renderers: {
      ...DEFAULT_CONFIG.input.renderers,
      ...customConfig.renderers,
    },
    labels: { ...DEFAULT_CONFIG.input.labels, ...customConfig.labels },
  };

  const { element } = creatQueryInput(inputOption);

  const inputWrapper = html` <div class="">${element}</div> ` as HTMLElement;

  mountPoint.append(inputWrapper);
};

export { configureTextInput };
