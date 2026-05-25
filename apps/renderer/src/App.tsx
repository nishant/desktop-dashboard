import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardGrid } from './components/DashboardGrid';
import { LayoutToolbar } from './components/LayoutToolbar';

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
      <div className="h-screen w-screen bg-zinc-950 overflow-hidden">
        <LayoutToolbar />
        <DashboardGrid />
      </div>
    </QueryClientProvider>
  );
}
