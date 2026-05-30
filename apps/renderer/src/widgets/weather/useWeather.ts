import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { WeatherData } from '@dash/shared';

export function useWeather() {
  return useQuery<WeatherData>({
    queryKey: ['weather'],
    queryFn: () => apiClient.get<WeatherData>('/api/weather'),
    refetchInterval: 15 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });
}
