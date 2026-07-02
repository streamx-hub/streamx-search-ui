interface CodeExamplesMap {
  [key: string]: string;
}

function renderCodeBlocks(examples: CodeExamplesMap) {
  document.querySelectorAll("pre[data-code]").forEach((pre) => {
    const key = pre.getAttribute("data-code") as string;

    if (key && key in examples) {
      pre.innerHTML = `<code>${examples[key as keyof typeof examples] || "// missing example"}</code>`;
    }
  });
}

function addNavigation(element: HTMLElement) {
  const navigation = document.createElement("header");
  navigation.classList.add("docs-header");
  navigation.innerHTML = `
    <h1>StreamX Search UI</h1>
    <nav class="docs-navigation">
      <ul>
        <li>
          <a href="/docs/pages/input-field/">
            <img src="#" alt="" />
            <span>Search input field</span>
          </a>
        </li>
        <li>
          <a href="/docs/pages/search-page-with-tabs/">
            <img src="#" alt="" />
            <span>Search results page with multiple tabs</span>
          </a>
        </li>
        <li>
          <a href="/docs/pages/search-page-without-tabs/">
            <img src="#" alt="" />
            <span>Search results page without tabs</span>
          </a>
        </li>
      </ul>
    </nav>
  `;

  element.prepend(navigation);
}

export { renderCodeBlocks, addNavigation };
