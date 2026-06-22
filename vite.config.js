import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { routes } from './mocks/routes'

export default defineConfig({
  build: {
    lib: {
      entry: {
        'streamx-search-inline': resolve(import.meta.dirname, 'src/inline-search/index.js'),
        'streamx-search-results-page': resolve(import.meta.dirname, 'src/search-results-page/index.js'),
      },
      name: 'streamx-search',
    },
  },
  plugins: [
    {
      name: 'mock-json',
      configureServer(server) {
        routes(server);
      },
    },
  ],
})