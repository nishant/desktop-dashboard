import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import { useLayoutStore } from '../store/layoutStore';
import { WidgetShell } from './WidgetShell';
import { WeatherWidget } from '../widgets/weather/WeatherWidget';
import { SpotifyWidget } from '../widgets/spotify/SpotifyWidget';
import { StocksWidget } from '../widgets/stocks/StocksWidget';
import { HardwareWidget } from '../widgets/hardware/HardwareWidget';
import { SoundWidget } from '../widgets/sound/SoundWidget';
import type { WidgetId } from '../lib/layouts';

const GridLayout = WidthProvider(ReactGridLayout);

const WIDGET_TITLES: Record<WidgetId, string> = {
  weather: 'Weather',
  spotify: 'Spotify',
  stocks: 'Stocks',
  hardware: 'Hardware',
  sound: 'Sound',
};

const WIDGET_COMPONENTS: Record<WidgetId, React.ReactNode> = {
  weather: <WeatherWidget />,
  spotify: <SpotifyWidget />,
  stocks: <StocksWidget />,
  hardware: <HardwareWidget />,
  sound: <SoundWidget />,
};

export function DashboardGrid() {
  const { layout, setLayout } = useLayoutStore();

  return (
    <GridLayout
      layout={layout}
      cols={24}
      rowHeight={40}
      margin={[8, 8]}
      containerPadding={[8, 8]}
      draggableHandle=".widget-drag-handle"
      onLayoutChange={setLayout}
      isResizable
      isDraggable
      resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n']}
    >
      {layout.map((item) => {
        const id = item.i as WidgetId;
        return (
          <div key={id}>
            <WidgetShell title={WIDGET_TITLES[id]}>
              {WIDGET_COMPONENTS[id]}
            </WidgetShell>
          </div>
        );
      })}
    </GridLayout>
  );
}
