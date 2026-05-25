import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { StocksData } from '@dash/shared';

export function useStocks() {
  return useQuery<StocksData>({
    queryKey: ['stocks'],
    queryFn: () => apiClient.get<StocksData>('/api/stocks'),
    refetchInterval: 5000,
    staleTime: 5000,
  });
}
