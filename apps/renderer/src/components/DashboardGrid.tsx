import { useState, useEffect, useMemo } from 'react';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useLayoutStore } from '../store/layoutStore';
import { WidgetShell } from './WidgetShell';
import { WeatherWidget } from '../widgets/weather/WeatherWidget';
import { SpotifyWidget } from '../widgets/spotify/SpotifyWidget';
import { StocksWidget } from '../widgets/stocks/StocksWidget';
import { HardwareWidget } from '../widgets/hardware/HardwareWidget';
import { SoundWidget } from '../widgets/sound/SoundWidget';
import { CalendarWidget } from '../widgets/calendar/CalendarWidget';
import { YoutubeWidget } from '../widgets/youtube/YoutubeWidget';
import { TITLEBAR_H } from './Titlebar';
import type { WidgetId } from '../lib/layouts';

const GridLayout = WidthProvider(ReactGridLayout);

const MARGIN = 8;
const PADDING = 8;

const WIDGET_TITLES: Record<WidgetId, string> = {
  weather: 'Weather',
  spotify: 'Spotify',
  stocks: 'Stocks',
  hardware: 'Hardware',
  sound: 'Sound',
  calendar: 'Calendar',
  youtube: 'YouTube',
};

const WIDGET_COMPONENTS: Record<WidgetId, React.ReactNode> = {
  weather: <WeatherWidget />,
  spotify: <SpotifyWidget />,
  stocks: <StocksWidget />,
  hardware: <HardwareWidget />,
  sound: <SoundWidget />,
  calendar: <CalendarWidget />,
  youtube: <YoutubeWidget />,
};

function useRowHeight(layout: Layout[]): number {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const numRows = useMemo(
    () => Math.max(...layout.map((item) => item.y + item.h), 1),
    [layout],
  );

  // Solve: availHeight = numRows * rowHeight + (numRows - 1) * MARGIN + 2 * PADDING
  const availHeight = windowHeight - TITLEBAR_H;
  return Math.max(10, (availHeight - (numRows - 1) * MARGIN - 2 * PADDING) / numRows);
}

export function DashboardGrid() {
  const { layout, setLayout } = useLayoutStore();
  const rowHeight = useRowHeight(layout);

  return (
    <GridLayout
      layout={layout}
      cols={24}
      rowHeight={rowHeight}
      margin={[MARGIN, MARGIN]}
      containerPadding={[PADDING, PADDING]}
      draggableHandle=".widget-drag-handle"
      onLayoutChange={setLayout}
      compactType="vertical"
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
