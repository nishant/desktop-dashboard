import type { Layout } from 'react-grid-layout';

export type WidgetId = 'weather' | 'spotify' | 'stocks' | 'hardware' | 'sound';

export interface NamedLayout {
  name: string;
  layout: Layout[];
}

// 24 cols, dynamic rowHeight (fills screen minus titlebar), margin=[8,8], containerPadding=[8,8]
// Every preset is mathematically gap-free — all 24×N cells covered by exactly one widget.
// Designed for 22 rows total (fills 1920×1080 with 32px titlebar at rowHeight≈39px).
//
// Verification key: for each column x, the sum of h values of widgets covering that x = numRows.

export const PRESETS: NamedLayout[] = [
  {
    // Cols 0-7:   Weather(h=10) + Hardware(h=12) = 22
    // Cols 8-15:  Spotify(h=10) + Hardware(h=12) = 22
    // Cols 16-23: Stocks(h=10)  + Sound(h=12)   = 22
    name: 'Default',
    layout: [
      { i: 'weather',  x: 0,  y: 0,  w: 8,  h: 10, minW: 4, minH: 4 },
      { i: 'spotify',  x: 8,  y: 0,  w: 8,  h: 10, minW: 4, minH: 5 },
      { i: 'stocks',   x: 16, y: 0,  w: 8,  h: 10, minW: 5, minH: 5 },
      { i: 'hardware', x: 0,  y: 10, w: 16, h: 12, minW: 6, minH: 4 },
      { i: 'sound',    x: 16, y: 10, w: 8,  h: 12, minW: 3, minH: 3 },
    ],
  },
  {
    // Cols 0-13:  Stocks(h=14) + Hardware(h=8)              = 22
    // Cols 14-18: Spotify(h=9) + Weather(h=5) + Hardware(h=8) = 22
    // Cols 19-23: Spotify(h=9) + Sound(h=5)   + Hardware(h=8) = 22
    name: 'Stocks Focus',
    layout: [
      { i: 'stocks',   x: 0,  y: 0,  w: 14, h: 14, minW: 5, minH: 5 },
      { i: 'spotify',  x: 14, y: 0,  w: 10, h: 9,  minW: 4, minH: 5 },
      { i: 'weather',  x: 14, y: 9,  w: 5,  h: 5,  minW: 4, minH: 4 },
      { i: 'sound',    x: 19, y: 9,  w: 5,  h: 5,  minW: 3, minH: 3 },
      { i: 'hardware', x: 0,  y: 14, w: 24, h: 8,  minW: 6, minH: 4 },
    ],
  },
  {
    // Cols 0-9:   Spotify(h=17) + Sound(h=5)     = 22
    // Cols 10-16: Weather(h=10) + Hardware(h=12) = 22
    // Cols 17-23: Stocks(h=10)  + Hardware(h=12) = 22
    name: 'Media',
    layout: [
      { i: 'spotify',  x: 0,  y: 0,  w: 10, h: 17, minW: 4, minH: 5 },
      { i: 'weather',  x: 10, y: 0,  w: 7,  h: 10, minW: 4, minH: 4 },
      { i: 'stocks',   x: 17, y: 0,  w: 7,  h: 10, minW: 5, minH: 5 },
      { i: 'hardware', x: 10, y: 10, w: 14, h: 12, minW: 6, minH: 4 },
      { i: 'sound',    x: 0,  y: 17, w: 10, h: 5,  minW: 3, minH: 3 },
    ],
  },
  {
    // Cols 0-15:  Hardware(h=12) + Spotify(h=10)  = 22
    // Cols 16-23: Stocks(h=12)   + Sound(h=10)    = 22
    // Cols 8-15 (bottom): Weather replaces Spotify there — see note
    // Cols 0-7:   Hardware(h=12) + Spotify(h=10)  = 22
    // Cols 8-15:  Hardware(h=12) + Weather(h=10)  = 22
    // Cols 16-23: Stocks(h=12)   + Sound(h=10)    = 22
    name: 'System',
    layout: [
      { i: 'hardware', x: 0,  y: 0,  w: 16, h: 12, minW: 6, minH: 4 },
      { i: 'stocks',   x: 16, y: 0,  w: 8,  h: 12, minW: 5, minH: 5 },
      { i: 'spotify',  x: 0,  y: 12, w: 8,  h: 10, minW: 4, minH: 5 },
      { i: 'weather',  x: 8,  y: 12, w: 8,  h: 10, minW: 4, minH: 4 },
      { i: 'sound',    x: 16, y: 12, w: 8,  h: 10, minW: 3, minH: 3 },
    ],
  },
  {
    // Spotify hero tall on the left, Stocks wide top-right, utility row bottom.
    // Cols 0-9:   Spotify(h=18) + Hardware(h=4)  = 22
    // Cols 10-16: Stocks(h=14)  + Weather(h=8)   = 22
    // Cols 17-23: Stocks(h=14)  + Sound(h=8)     = 22
    name: 'Focus',
    layout: [
      { i: 'spotify',  x: 0,  y: 0,  w: 10, h: 18, minW: 4, minH: 5 },
      { i: 'stocks',   x: 10, y: 0,  w: 14, h: 14, minW: 5, minH: 5 },
      { i: 'weather',  x: 10, y: 14, w: 7,  h: 8,  minW: 4, minH: 4 },
      { i: 'sound',    x: 17, y: 14, w: 7,  h: 8,  minW: 3, minH: 3 },
      { i: 'hardware', x: 0,  y: 18, w: 10, h: 4,  minW: 6, minH: 4 },
    ],
  },
  {
    // Info stack left, Stocks + Spotify each fill full height as columns.
    // Cols 0-7:   Weather(h=8) + Hardware(h=9) + Sound(h=5) = 22
    // Cols 8-15:  Stocks(h=22)                              = 22
    // Cols 16-23: Spotify(h=22)                             = 22
    name: 'Chill',
    layout: [
      { i: 'weather',  x: 0,  y: 0,  w: 8,  h: 8,  minW: 4, minH: 4 },
      { i: 'hardware', x: 0,  y: 8,  w: 8,  h: 9,  minW: 6, minH: 4 },
      { i: 'sound',    x: 0,  y: 17, w: 8,  h: 5,  minW: 3, minH: 3 },
      { i: 'stocks',   x: 8,  y: 0,  w: 8,  h: 22, minW: 5, minH: 5 },
      { i: 'spotify',  x: 16, y: 0,  w: 8,  h: 22, minW: 4, minH: 5 },
    ],
  },
  {
    // Two big horizontal rows — stocks+spotify fill the top half,
    // hardware+weather+sound fill the bottom half.
    // Cols 0-13:  Stocks(h=12)   + Hardware(h=10) = 22
    // Cols 14-17: Spotify(h=12)  + Weather(h=10)  = 22
    // Cols 18-23: Spotify(h=12)  + Sound(h=10)    = 22
    name: 'Wide',
    layout: [
      { i: 'stocks',   x: 0,  y: 0,  w: 14, h: 12, minW: 5, minH: 5 },
      { i: 'spotify',  x: 14, y: 0,  w: 10, h: 12, minW: 4, minH: 5 },
      { i: 'hardware', x: 0,  y: 12, w: 14, h: 10, minW: 6, minH: 4 },
      { i: 'weather',  x: 14, y: 12, w: 5,  h: 10, minW: 4, minH: 4 },
      { i: 'sound',    x: 19, y: 12, w: 5,  h: 10, minW: 3, minH: 3 },
    ],
  },
];

export const DEFAULT_LAYOUT = PRESETS[0];
