import { ViteDevServer } from "vite";
import { getData } from "./results-data";

const TABS_COUT = 6;

const TABS_CONGIFS = [
  {
    type: "Products",
    count: 100
  },
  {
    type: "Articles",
    count: 15
  },
  {
    type: "Videos",
    count: 23
  },
  {
    type: "Documents",
    count: 1001
  },
  {
    type: "Images",
    count: 321,
  },
  {
    type: "Other",
    count: 2051,
  },
];

const addMiddleware = (
  server: ViteDevServer,
  assetUrl: string,
  tabId: number,
) => {
  server.middlewares.use(assetUrl, (req, res) => {
    const url = new URL(req.url!, "http://localhost");
    const from = url.searchParams.get("from");
    const pageSize = url.searchParams.get("size");

    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify(
        getData(Number(from), Number(pageSize), TABS_CONGIFS[tabId].type,  TABS_CONGIFS[tabId].count),
      ),
    );
  });
};

export function routes(server: ViteDevServer) {
  for (let i = 0; i < TABS_COUT; i++) {
    addMiddleware(server, `/results-data-tab-${i + 1}.json`, i);
  }
}
