const DEFAULT_RESULTS_COUNT = 60;

const createValue = (id: number, title: string, type: string) => ({
  _id: `${title} ${id}`,
  _score: 0.0,
  _source: {
    type: id % 5 === 0 ? `products` : type,
    image: `https://placehold.co/600x400?text=${title}%20${id}`,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    link: `/product/${id}`,
    payload: {
      title: "Solutions for AEM and Edge Delivery Performance in China",
      facets: {
        category_hierarchy: [
          "Blogs",
          "Content type>Blogs",
          "China",
          "tags>China",
          "Russia",
          "tags>Russia",
          "Turkey",
          "tags>Turkey",
          "webperf",
          "tags>webperf",
          "performance",
          "tags>performance",
          "aem",
          "tags>aem",
          "aemaacs",
          "tags>aemaacs",
          "aem cloud",
          "tags>aem cloud",
          "dynamic media",
          "tags>dynamic media",
          "edge delivery",
          "tags>edge delivery",
          "helix",
          "tags>helix",
          "streamx",
          "tags>streamx",
          "event streaming",
          "tags>event streaming",
          "digital experience mesh",
          "tags>digital experience mesh",
          "chinafy",
          "tags>chinafy",
          "dispatcher",
          "tags>dispatcher",
          "AEM Technical Help",
          "Category>AEM Technical Help",
        ],
        searchtags:
          "Arbory Display | Content type / Blogs, Arbory Display | tags / China, Arbory Display | tags / Russia, Arbory Display | tags / Turkey, Arbory Display | tags / webperf, Arbory Display | tags / performance, Arbory Display | tags / aem, Arbory Display | tags / aemaacs, Arbory Display | tags / aem cloud, Arbory Display | tags / dynamic media, Arbory Display | tags / edge delivery, Arbory Display | tags / helix, Arbory Display | tags / streamx, Arbory Display | tags / event streaming, Arbory Display | tags / digital experience mesh, Arbory Display | tags / chinafy, Arbory Display | tags / dispatcher, Arbory Display | Category / AEM Technical Help",
        tags_level0: [
          "China",
          "Russia",
          "Turkey",
          "webperf",
          "performance",
          "aem",
          "aemaacs",
          "aem cloud",
          "dynamic media",
          "edge delivery",
          "helix",
          "streamx",
          "event streaming",
          "digital experience mesh",
          "chinafy",
          "dispatcher",
        ],
        content_type_level0: ["Blogs"],
        categories_level0: ["AEM Technical Help"],
      },
    },
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
    aggregations: {
      category_level0: {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [],
      },
      tags_level0: {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [
          {
            key: "aem",
            doc_count: 10,
          },
          {
            key: "helix",
            doc_count: 10,
          },
          {
            key: "eds",
            doc_count: 7,
          },
          {
            key: "adobe experience manager",
            doc_count: 6,
          },
          {
            key: "edge delivery services",
            doc_count: 6,
          },
          {
            key: "AEM",
            doc_count: 4,
          },
          {
            key: "EDS",
            doc_count: 4,
          },
          {
            key: "Helix",
            doc_count: 4,
          },
          {
            key: "aem cloud",
            doc_count: 3,
          },
          {
            key: "aemaacs",
            doc_count: 3,
          },
          {
            key: "dynamic media",
            doc_count: 3,
          },
          {
            key: "edge delivery",
            doc_count: 3,
          },
          {
            key: "Adobe",
            doc_count: 2,
          },
          {
            key: "Adobe summit",
            doc_count: 2,
          },
          {
            key: "Edge Delivery Services",
            doc_count: 2,
          },
          {
            key: "Franklin",
            doc_count: 2,
          },
          {
            key: "da",
            doc_count: 2,
          },
          {
            key: "digital experience mesh",
            doc_count: 2,
          },
          {
            key: "event streaming",
            doc_count: 2,
          },
          {
            key: "migration",
            doc_count: 2,
          },
          {
            key: "streamx",
            doc_count: 2,
          },
          {
            key: "AEM Franklin",
            doc_count: 1,
          },
          {
            key: "Adobe Summit",
            doc_count: 1,
          },
          {
            key: "China",
            doc_count: 1,
          },
          {
            key: "Composability",
            doc_count: 1,
          },
          {
            key: "Edge Delivery Service",
            doc_count: 1,
          },
          {
            key: "Project Helix",
            doc_count: 1,
          },
          {
            key: "Russia",
            doc_count: 1,
          },
          {
            key: "Turkey",
            doc_count: 1,
          },
          {
            key: "chinafy",
            doc_count: 1,
          },
          {
            key: "dark alley",
            doc_count: 1,
          },
          {
            key: "dispatcher",
            doc_count: 1,
          },
          {
            key: "document authoring",
            doc_count: 1,
          },
          {
            key: "how to",
            doc_count: 1,
          },
          {
            key: "meetup",
            doc_count: 1,
          },
          {
            key: "performance",
            doc_count: 1,
          },
          {
            key: "universal editor",
            doc_count: 1,
          },
          {
            key: "webperf",
            doc_count: 1,
          },
        ],
      },
      categories_level0: {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [
          {
            key: "Podcast",
            doc_count: 5,
          },
          {
            key: "AEM Technical Help",
            doc_count: 4,
          },
          {
            key: "Podcasts",
            doc_count: 3,
          },
          {
            key: "AEM News",
            doc_count: 2,
          },
        ],
      },
      content_type_level0: {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [
          {
            key: "Podcasts",
            doc_count: 8,
          },
          {
            key: "Blogs",
            doc_count: 6,
          },
        ],
      },
    },
    hits: {
      total: {
        value: count || DEFAULT_RESULTS_COUNT,
      },
      hits,
    },
  };
};
