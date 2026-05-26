import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Titlebar } from './components/Titlebar';
import { DashboardGrid } from './components/DashboardGrid';

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
      <div className="h-screen w-screen bg-zinc-950 overflow-hidden flex flex-col">
        <Titlebar />
        <div className="flex-1 min-h-0">
          <DashboardGrid />
        </div>
      </div>
    </QueryClientProvider>
  );
}
