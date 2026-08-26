/**
 * Packaging smoke test.
 *
 * Builds a tarball with `npm pack`, installs it into a throwaway fixture and
 * checks that a consumer can actually use it: every subpath in `exports`
 * resolves, the declarations typecheck, the CSS is reachable and a bundler can
 * build against it.
 *
 * This exists because the failure it guards against is silent - a broken
 * `types` path or a mis-rooted declaration tree builds cleanly here and only
 * breaks in someone else's project.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const fixture = mkdtempSync(join(tmpdir(), "streamx-search-pack-"));

const bin = (name) =>
  join(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: "pipe" });

const step = (label, fn) => {
  process.stdout.write(`  ${label} ... `);
  try {
    fn();
    process.stdout.write("ok\n");
  } catch (error) {
    process.stdout.write("FAILED\n\n");
    process.stderr.write(`${error.stdout || ""}${error.stderr || error}\n`);
    rmSync(fixture, { recursive: true, force: true });
    process.exit(1);
  }
};

console.log(`\nPackaging smoke test\n  fixture: ${fixture}\n`);

let tarball;

step("npm pack", () => {
  const out = run("npm", ["pack", "--pack-destination", fixture], repoRoot);
  tarball = join(fixture, out.trim().split("\n").at(-1));
});

step("install tarball", () => {
  mkdirSync(join(fixture, "app", "src"), { recursive: true });

  writeFileSync(
    join(fixture, "app", "package.json"),
    JSON.stringify(
      { name: "fixture", private: true, type: "module", version: "0.0.0" },
      null,
      2,
    ),
  );

  run(
    "npm",
    ["install", "--no-audit", "--no-fund", tarball],
    join(fixture, "app"),
  );
});

step("typecheck consumer", () => {
  writeFileSync(
    join(fixture, "app", "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "es2023",
          module: "esnext",
          moduleResolution: "bundler",
          lib: ["ES2023", "DOM"],
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );

  // Exercises the root entry, every subpath, and the public type surface -
  // types are imported by name so a missing re-export fails the build.
  writeFileSync(
    join(fixture, "app", "src", "consumer.ts"),
    `
import {
  createSearchInput,
  createResultsPanel,
  createSearchTabs,
  mountSearchModal,
  getHitUrl,
} from "@streamx-hub/search";
import type {
  QueryInputConfig,
  ResultsConfig,
  TabConfig,
  ModalConfig,
  OpenSearchItem,
  OpenSearchResponse,
  QueryInputRenderers,
  ResultsPanelRenderers,
  ResultsPanelLabelsConfig,
  AnalyticsEvents,
} from "@streamx-hub/search";

import { createSearchInput as fromInline } from "@streamx-hub/search/search-inline";
import { createResultsPanel as fromPanel } from "@streamx-hub/search/search-results-panel";
import { createSearchTabs as fromTabs } from "@streamx-hub/search/search-tabs";
import type { ResultsConfig as PanelScopedConfig } from "@streamx-hub/search/search-results-panel";

import decorateResultsPanel from "@streamx-hub/search/eds/search-results-panel";
import decorateSearchTabs from "@streamx-hub/search/eds/search-tabs";
import decorateSearchTab from "@streamx-hub/search/eds/search-tab";

const input: QueryInputConfig = { searchApiUrl: "/api/search" };
const results: ResultsConfig = { dataSources: ["/api/results"], method: "POST" };
const scoped: PanelScopedConfig = { dataSources: ["/api/results"] };
const tabs: TabConfig[] = [{ id: "a", displayName: "A", results }];
const modal: ModalConfig = { searchOpenElementSelector: "#open", input };
const renderers: ResultsPanelRenderers = {
  "item-page": (item: OpenSearchItem) => {
    const el = document.createElement("a");
    el.href = getHitUrl(item);
    return el;
  },
};
const inputRenderers: Partial<QueryInputRenderers> = { clearIcon: () => "x" };
const labels: ResultsPanelLabelsConfig = { totalResults: (n) => \`\${n}\` };
const onEvent = (e: AnalyticsEvents) => String(e.type);
const response: OpenSearchResponse = { timed_out: false, hits: { total: { value: 0 } } };

export {
  createSearchInput, createResultsPanel, createSearchTabs, mountSearchModal,
  fromInline, fromPanel, fromTabs,
  decorateResultsPanel, decorateSearchTabs, decorateSearchTab,
  input, results, scoped, tabs, modal, renderers, inputRenderers, labels, onEvent, response,
};
`,
  );

  // The repo's own tsc, run against the fixture's cwd, so the check needs no
  // network and pins the compiler to the version the library is built with.
  run(bin("tsc"), ["-p", "."], join(fixture, "app"));
});

step("every exports target exists", () => {
  const installed = join(
    fixture,
    "app",
    "node_modules",
    "@streamx-hub",
    "search",
  );
  const { exports: map } = JSON.parse(
    readFileSync(join(installed, "package.json"), "utf8"),
  );

  const targets = Object.entries(map).flatMap(([subpath, target]) =>
    (typeof target === "string" ? [target] : Object.values(target)).map(
      (file) => [subpath, file],
    ),
  );

  const missing = targets.filter(
    ([, file]) => !existsSync(join(installed, file)),
  );

  if (missing.length) {
    throw new Error(
      `exports targets missing from the published package:\n` +
        missing.map(([subpath, file]) => `  ${subpath} -> ${file}`).join("\n"),
    );
  }

  process.stdout.write(`(${targets.length} targets) `);
});

step("bundler build", () => {
  writeFileSync(
    join(fixture, "app", "src", "entry.js"),
    `
import { createSearchInput } from "@streamx-hub/search";
import { createResultsPanel } from "@streamx-hub/search/search-results-panel";
import "@streamx-hub/search/streamx-search.css";
console.log(createSearchInput, createResultsPanel);
`,
  );

  writeFileSync(
    join(fixture, "app", "vite.config.js"),
    `export default { build: { lib: { entry: "src/entry.js", formats: ["es"], fileName: "out" } }, logLevel: "warn" };`,
  );

  run(bin("vite"), ["build"], join(fixture, "app"));
});

rmSync(fixture, { recursive: true, force: true });
console.log("\nPackaging smoke test passed.\n");
