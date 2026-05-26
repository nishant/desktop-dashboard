import { useQuery } from '@tanstack/react-query';
import type { YoutubeSearchPage } from '@dash/shared';

const BASE = 'http://localhost:7432/api/youtube';

export function useYoutubeSearch(query: string, pageToken?: string) {
  return useQuery<YoutubeSearchPage>({
    queryKey: ['youtube-search', query, pageToken],
    queryFn: async () => {
      const url = new URL(`${BASE}/search`);
      url.searchParams.set('q', query);
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return res.json() as Promise<YoutubeSearchPage>;
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // cache results 5 min
  });
}
