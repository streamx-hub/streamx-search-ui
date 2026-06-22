const DEFAULT_RESULTS_COUNT = 60;

const createValue = (id: number, title: string) => ({
  _id: `${title} ${id}`,
  _score: 0.0,
  _source: {
    namespace: "puresight_product",
    type: "product/simple",
    image: `https://placehold.co/600x400?text=${title}%20${id}`,
  },
});


export const getData = (from: number, pageSize: number, title: string, count: number) => {
  let data =  [];

  for (let i = 0; i < (count || DEFAULT_RESULTS_COUNT); i++) {
    data.push(createValue(i + 1, title));
  }


  const hits = data.slice(from, pageSize + from);

  return {
    timed_out: false,
    hits: {
      total: {
        value: count || DEFAULT_RESULTS_COUNT,
      },
      hits,
    },
  };
};
