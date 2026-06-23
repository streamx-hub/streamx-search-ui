const dataList = [
  {
    _id: "/products/lift-top-storage-coffee-table-natural-2097.html",
    _source: {
      payload: {
        title: "Lift-Top Storage Coffee Table, Natural",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/lift-top-storage-coffee-table-white-2098.html",
    _source: {
      payload: {
        title: "Lift-Top Storage Coffee Table, White",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/rivet-bristol-natural-edge-black-metal-side-table-walnut-2092.html",
    _source: {
      payload: {
        title: "Rivet Bristol Natural Edge Black Metal Side Table, Walnut",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/kid-table-set-with-dry-erasable-table-top-b07ybhc881.html",
    _source: {
      payload: {
        title: "Kid Table Set with Dry Erasable Table Top",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/solid-pine-rustic-farmhouse-end-table-22-w-rustic-oak-b084l7sndg.html",
    _source: {
      payload: {
        title: "Solid Pine Rustic Farmhouse End Table, 22&quot;W, Rustic Oak",
      },

      type: "page/product",
    },
  },
  {
    _id: "/products/ravenna-home-heights-wood-lift-top-storage-coffee-table-43-3-w-espresso-b07dbb1gqw.html",
    _source: {
      payload: {
        title:
          "Ravenna Home Heights Wood Lift Top Storage Coffee Table, 43.3&quot;W, Espresso",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/parson-nightstand-table-22-w-natural-b0728ksp2r.html",
    _source: {
      payload: {
        title: "Parson Nightstand Table, 22&quot;W, Natural",
      },
      type: "page/product",
    },
  },
];

const insertAt = (text: string, index: number, insert: string) => {
  return text.slice(0, index) + insert + text.slice(index);
};

export const getSuggestions = (query: string) => {
  const filteredData = !query
    ? dataList
    : dataList.filter((item) => {
        return item._source.payload.title
          .toLowerCase()
          .includes(query.toLocaleLowerCase());
      });

  const resultsList = filteredData.map((item) => {
    const text = item._source.payload.title.toLowerCase();
    const startIndex = text.indexOf(query.toLowerCase());
    const endIndex = startIndex + query.length;
    const textWithEndTag = insertAt(text, endIndex, "</em>");
    const textWithStartTag = insertAt(textWithEndTag, startIndex, "<em>");

    return {
      ...item,
      highlight: {
        "payload.title": [textWithStartTag],
      },
    };
  });

  return {
    timed_out: false,
    hits: {
      total: {
        value: resultsList.length,
      },
      hits: resultsList,
    },
  };
};
