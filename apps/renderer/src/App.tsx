import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Titlebar } from './components/Titlebar';
import { DashboardGrid } from './components/DashboardGrid';
import { useThemeStore } from './store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        data-theme={theme}
        className="h-screen w-screen bg-th-bg overflow-hidden flex flex-col"
      >
        <Titlebar />
        <div className="flex-1 min-h-0">
          <DashboardGrid />
        </div>
      </div>
    </QueryClientProvider>
  );
}
