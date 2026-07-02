import { resolve } from "node:path";
import { defineConfig } from "vite";
import { routes } from "./mocks/routes";

export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        "streamx-search-inline": resolve(
          import.meta.dirname,
          "src/exports/search-inline.ts",
        ),
        "streamx-search-tabs": resolve(
          import.meta.dirname,
          "src/exports/search-tabs.ts",
        ),
        "streamx-serach-result-panel": resolve(
          import.meta.dirname,
          "src/exports/search-results-panel.ts",
        ),
      },
      name: "streamx-search",
      formats: ["es"],
    },
  },
  plugins: [
    {
      name: "mock-json",
      configureServer(server) {
        routes(server);
      },
    },
  ],
});
