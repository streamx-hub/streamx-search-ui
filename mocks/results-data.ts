const DEFAULT_RESULTS_COUNT = 60;

const createValue = (id: number, title: string, type: string) => ({
  _id: `${title} ${id}`,
  _score: 0.0,
  _source: {
    type: id % 5 === 0 ? `products` : type,
    image: `https://placehold.co/600x400?text=${title}%20${id}`,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    link: `/product/${id}`,
  },
});

export const getData = (
  from: number,
  pageSize: number,
  title: string,
  count: number,
) => {
  const data = [];

  for (let i = 0; i < (count || DEFAULT_RESULTS_COUNT); i++) {
    const type = title.toLocaleLowerCase().replaceAll(" ", "-");
    data.push(createValue(i + 1, title, type));
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
