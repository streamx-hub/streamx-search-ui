const searchApiUrl = () => {
  const mock1 = '/src/assets/mocks/search-data.json';
  const mock2 = '/src/assets/mocks/search-data-2.json';

  return Math.random() > 0.5 ? mock1 : mock2;
};

const initSearchPage = async (mountPoint: Element) => {
  const { configureTextInput } = await import('../../src/search-results-page/index');

  configureTextInput(mountPoint, {
    searchApiUrl
  });
}

const appEl = document.querySelector('#app');

if (appEl) {
  initSearchPage(appEl);
} else {
  throw new Error ("The #app element is not available!");
}
