import { html } from "./helper";

export const loadCssFile = (cssFile: string) => {
  const styleEl = document.createElement("link");

  styleEl.setAttribute("href", cssFile);
  styleEl.setAttribute("rel", "stylesheet");
  document.head.append(styleEl);
};

export const renderEDSLableTemplate = (
  template: string | undefined,
  values: Record<string, string | number>,
) => {
  if (!template) return "";

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
};

export const getEDSConfig = <
  TConfig extends Record<string, string | undefined>,
>(
  block: HTMLElement,
): Partial<TConfig> => {
  const rows = [...block.querySelectorAll(":scope > div")];
  const config: Partial<TConfig> = {};

  rows.forEach((row, index) => {
    try {
      const [keyEl, valueEl] = row.querySelectorAll(":scope > div");

      const key = keyEl?.textContent?.trim() as keyof TConfig;
      const value = valueEl?.textContent?.trim();

      if (key && value !== undefined) {
        config[key] = value as TConfig[typeof key];
      }
    } catch (error) {
      console.error(
        `There are some problems with building EDS config. Row number: ${index + 1}`,
        error,
        block,
      );
    }
  });

  return config;
};

export const replaceElWithError = (root: HTMLElement, error: string) => {
  const errorEl = html`
    <div
      style="
        color: red;
        padding: 10px;
        border: solid 2px red;
        background: rgba(255, 0, 0, 0.2)
      "
    >
      ${error}
    </div>
  ` as HTMLElement;

  root.append(errorEl);
};
