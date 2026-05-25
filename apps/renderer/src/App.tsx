import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeatherWidget } from './widgets/weather/WeatherWidget';
import { SpotifyWidget } from './widgets/spotify/SpotifyWidget';
import { StocksWidget } from './widgets/stocks/StocksWidget';
import { HardwareWidget } from './widgets/hardware/HardwareWidget';
import { SoundWidget } from './widgets/sound/SoundWidget';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden p-2 grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
        <WeatherWidget />
        <SpotifyWidget />
        <StocksWidget />
        <HardwareWidget />
        <SoundWidget />
      </div>
    </QueryClientProvider>
  );
}
