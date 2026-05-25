import type { Layout } from 'react-grid-layout';

export type WidgetId = 'weather' | 'spotify' | 'stocks' | 'hardware' | 'sound';

export interface NamedLayout {
  name: string;
  layout: Layout[];
}

// 24 cols, rowHeight=40, margin=[8,8], containerPadding=[8,8]
// Designed for 1920x1080 (~22 rows fill the screen)

export const PRESETS: NamedLayout[] = [
  {
    name: 'Default',
    layout: [
      { i: 'weather',  x: 0,  y: 0,  w: 8,  h: 7,  minW: 4, minH: 4 },
      { i: 'spotify',  x: 8,  y: 0,  w: 7,  h: 13, minW: 4, minH: 6 },
      { i: 'stocks',   x: 15, y: 0,  w: 9,  h: 13, minW: 5, minH: 5 },
      { i: 'hardware', x: 0,  y: 7,  w: 15, h: 8,  minW: 6, minH: 4 },
      { i: 'sound',    x: 0,  y: 15, w: 24, h: 7,  minW: 3, minH: 3 },
    ],
  },
  {
    name: 'Stocks Focus',
    layout: [
      { i: 'stocks',   x: 0,  y: 0,  w: 14, h: 13, minW: 5, minH: 5 },
      { i: 'spotify',  x: 14, y: 0,  w: 10, h: 8,  minW: 4, minH: 6 },
      { i: 'weather',  x: 14, y: 8,  w: 5,  h: 5,  minW: 4, minH: 4 },
      { i: 'sound',    x: 19, y: 8,  w: 5,  h: 5,  minW: 3, minH: 3 },
      { i: 'hardware', x: 0,  y: 13, w: 24, h: 9,  minW: 6, minH: 4 },
    ],
  },
  {
    name: 'Media',
    layout: [
      { i: 'spotify',  x: 0,  y: 0,  w: 10, h: 16, minW: 4, minH: 6 },
      { i: 'weather',  x: 10, y: 0,  w: 7,  h: 8,  minW: 4, minH: 4 },
      { i: 'stocks',   x: 17, y: 0,  w: 7,  h: 12, minW: 5, minH: 5 },
      { i: 'hardware', x: 10, y: 8,  w: 14, h: 8,  minW: 6, minH: 4 },
      { i: 'sound',    x: 0,  y: 16, w: 10, h: 6,  minW: 3, minH: 3 },
    ],
  },
  {
    name: 'System',
    layout: [
      { i: 'hardware', x: 0,  y: 0,  w: 16, h: 11, minW: 6, minH: 4 },
      { i: 'spotify',  x: 16, y: 0,  w: 8,  h: 7,  minW: 4, minH: 6 },
      { i: 'weather',  x: 16, y: 7,  w: 4,  h: 4,  minW: 4, minH: 4 },
      { i: 'sound',    x: 20, y: 7,  w: 4,  h: 4,  minW: 3, minH: 3 },
      { i: 'stocks',   x: 0,  y: 11, w: 24, h: 11, minW: 5, minH: 5 },
    ],
  },
];

export const DEFAULT_LAYOUT = PRESETS[0];
