import { creatQueryInput } from "../components/query-input/query-input";
import { html } from "../helper";
import type { QueryInputConfig } from "../types/config";
import '../styles/common.css';

const createTextInput = (mountPoint: Element, customConfig: QueryInputConfig) => {
  const { element } = creatQueryInput(customConfig);

  const inputWrapper = html` <div class="">${element}</div> ` as HTMLElement;

  mountPoint.append(inputWrapper);
};

export { createTextInput };
