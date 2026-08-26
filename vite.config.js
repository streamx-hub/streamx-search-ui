import { resolve } from "node:path";
import { defineConfig } from "vite";
import { routes } from "./mocks/routes";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/exports/index.ts"),
        "streamx-search-inline": resolve(
          import.meta.dirname,
          "src/exports/search-inline.ts",
        ),
        "streamx-search-tabs": resolve(
          import.meta.dirname,
          "src/exports/search-tabs.ts",
        ),
        "streamx-search-results-panel": resolve(
          import.meta.dirname,
          "src/exports/search-results-panel.ts",
        ),
        "eds/search-tabs": resolve(
          import.meta.dirname,
          "src/exports/eds/decorate-search-tabs.ts",
        ),
        "eds/search-tab": resolve(
          import.meta.dirname,
          "src/exports/eds/decorate-search-tab.ts",
        ),
        "eds/search-results-panel": resolve(
          import.meta.dirname,
          "src/exports/eds/decorate-results-panel.ts",
        ),
      },
      name: "streamx-search",
      formats: ["es"],
      // Pinned, because Vite otherwise derives it from the package name - so
      // scoping the package to `@streamx-hub/search` silently renamed the
      // stylesheet to `search.css` and broke the `./streamx-search.css` export.
      cssFileName: "streamx-search",
    },
  },
  plugins: [
    {
      name: "mock-json",
      configureServer(server) {
        routes(server);
      },
    },
    dts({
      // Rooted at `src`, not `src/exports`, so the declaration tree keeps the
      // same shape as the source. Rooting it at the entries instead hoisted
      // them to `dist/` while their shared imports landed under `dist/src/**`,
      // leaving every relative specifier - and so every `types` path in
      // `exports` - unresolvable for a consumer.
      entryRoot: "src",
      outDir: "dist",
    }),
  ],
});
