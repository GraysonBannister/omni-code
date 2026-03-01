declare module 'duckduckgo-search' {
  interface SearchResult {
    title: string;
    link: string;
    snippet?: string;
    description?: string;
  }

  interface SearchOptions {
    maxResults?: number;
  }

  export function search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
