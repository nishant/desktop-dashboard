import { useQuery } from '@tanstack/react-query';
import type { TwitchSearchPage } from '@dash/shared';

const BASE = 'http://localhost:7432/api/twitch';

export function useTwitchSearch(query: string, after?: string) {
  return useQuery<TwitchSearchPage>({
    queryKey: ['twitch-search', query, after],
    queryFn: async () => {
      const url = new URL(`${BASE}/search`);
      url.searchParams.set('q', query);
      if (after) url.searchParams.set('after', after);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return res.json() as Promise<TwitchSearchPage>;
    },
    enabled: query.length > 0,
    staleTime: 60 * 1000, // streams go on/offline — shorter cache than YouTube
  });
}
