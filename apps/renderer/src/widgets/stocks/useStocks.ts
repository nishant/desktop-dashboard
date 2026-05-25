import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useStocksStore } from '../../store/stocksStore';
import type { StocksData } from '@dash/shared';

export function useStocks() {
  const watchlist = useStocksStore((s) => s.watchlist);
  return useQuery<StocksData>({
    queryKey: ['stocks', watchlist],
    queryFn: () => apiClient.get<StocksData>(`/api/stocks?symbols=${watchlist.join(',')}`),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
    enabled: watchlist.length > 0,
  });
}
