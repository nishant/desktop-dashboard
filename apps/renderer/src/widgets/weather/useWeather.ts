import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { WeatherData } from '@dash/shared';

type Coords = { lat: number; lon: number };

function useGeolocation(): { coords: Coords | null; denied: boolean } {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setDenied(true),
      { timeout: 10_000 },
    );
  }, []);

  return { coords, denied };
}

export function useWeather() {
  const { coords, denied } = useGeolocation();

  return {
    denied,
    ...useQuery<WeatherData>({
      queryKey: ['weather', coords],
      queryFn: () =>
        apiClient.get<WeatherData>(`/api/weather?lat=${coords!.lat}&lon=${coords!.lon}`),
      enabled: coords !== null,
      refetchInterval: 15 * 60 * 1000,
      staleTime: 15 * 60 * 1000,
    }),
  };
}
