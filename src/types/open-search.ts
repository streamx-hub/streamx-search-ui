export interface OpenSearchItem {
  _id: string;
  _score: number | null;
  _source: {
    type?: string;
    [key: string]: any;
  };
  highlight?: Record<string, string[]>;
}

export interface OpenSearchResponse {
  timed_out: boolean;
  hits: {
    total: {
      value: number;
    };
    hits?: OpenSearchItem[];
  };
}
