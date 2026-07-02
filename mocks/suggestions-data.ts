const dataList = [
  {
    _id: "/products/1.html",
    _source: {
      payload: {
        title: "Chair",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/2.html",
    _source: {
      payload: {
        title: "Storage Coffee Table, White",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/3.html",
    _source: {
      payload: {
        title: "Storage Coffee Table, Black",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/4.html",
    _source: {
      payload: {
        title: "Kid Table Set",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/5.html",
    _source: {
      payload: {
        title: "Rustic Table",
      },

      type: "page/product",
    },
  },
  {
    _id: "/products/6.html",
    _source: {
      payload: {
        title: "Coffee Table Espresso",
      },
      type: "page/product",
    },
  },
  {
    _id: "/products/7.html",
    _source: {
      payload: {
        title: "Table",
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
