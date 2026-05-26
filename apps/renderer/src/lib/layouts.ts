import type { Layout } from 'react-grid-layout';

export type WidgetId = 'weather' | 'spotify' | 'stocks' | 'hardware' | 'sound' | 'calendar';

export interface NamedLayout {
  name: string;
  layout: Layout[];
}

// 24 cols, dynamic rowHeight (fills screen minus titlebar), margin=[8,8], containerPadding=[8,8]
// Every preset is gap-free — all 24×N cells covered by exactly one widget.
// Designed for 22 rows (fills 1920×1080 with 32px titlebar).
//
// Verification key: for each column x, sum of h values of widgets covering that x = numRows.

export const PRESETS: NamedLayout[] = [
  {
    // 4 equal top widgets + 2 bottom
    // Cols  0-5:  weather(h=10)  + hardware(h=12) = 22
    // Cols  6-11: spotify(h=10)  + hardware(h=12) = 22
    // Cols 12-15: stocks(h=10)   + hardware(h=12) = 22
    // Cols 16-17: stocks(h=10)   + sound(h=12)    = 22
    // Cols 18-23: calendar(h=10) + sound(h=12)    = 22
    name: 'Default',
    layout: [
      { i: 'weather',  x: 0,  y: 0,  w: 6,  h: 10, minW: 4, minH: 4 },
      { i: 'spotify',  x: 6,  y: 0,  w: 6,  h: 10, minW: 4, minH: 5 },
      { i: 'stocks',   x: 12, y: 0,  w: 6,  h: 10, minW: 5, minH: 5 },
      { i: 'calendar', x: 18, y: 0,  w: 6,  h: 10, minW: 4, minH: 4 },
      { i: 'hardware', x: 0,  y: 10, w: 16, h: 12, minW: 6, minH: 4 },
      { i: 'sound',    x: 16, y: 10, w: 8,  h: 12, minW: 3, minH: 3 },
    ],
  },
  {
    // Stocks dominant left, calendar mid-right, small widgets around it
    // Cols  0-11: stocks(h=13)   + hardware(h=9)  = 22
    // Cols 12-17: spotify(h=9)   + calendar(h=13) = 22
    // Cols 18-23: spotify(h=9)   + weather(h=6)   + sound(h=7) = 22
    name: 'Markets',
    layout: [
      { i: 'stocks',   x: 0,  y: 0,  w: 12, h: 13, minW: 5, minH: 5 },
      { i: 'spotify',  x: 12, y: 0,  w: 12, h: 9,  minW: 4, minH: 5 },
      { i: 'calendar', x: 12, y: 9,  w: 6,  h: 13, minW: 4, minH: 4 },
      { i: 'weather',  x: 18, y: 9,  w: 6,  h: 6,  minW: 4, minH: 4 },
      { i: 'sound',    x: 18, y: 15, w: 6,  h: 7,  minW: 3, minH: 3 },
      { i: 'hardware', x: 0,  y: 13, w: 12, h: 9,  minW: 6, minH: 4 },
    ],
  },
  {
    // Spotify tall left, calendar + stocks top-right, hardware + weather bottom-right
    // Cols  0-8:  spotify(h=17)  + sound(h=5)     = 22
    // Cols  9-16: calendar(h=11) + hardware(h=11) = 22
    // Cols 17-23: stocks(h=11)   + weather(h=11)  = 22
    name: 'Media',
    layout: [
      { i: 'spotify',  x: 0,  y: 0,  w: 9,  h: 17, minW: 4, minH: 5 },
      { i: 'calendar', x: 9,  y: 0,  w: 8,  h: 11, minW: 4, minH: 4 },
      { i: 'stocks',   x: 17, y: 0,  w: 7,  h: 11, minW: 5, minH: 5 },
      { i: 'hardware', x: 9,  y: 11, w: 8,  h: 11, minW: 6, minH: 4 },
      { i: 'weather',  x: 17, y: 11, w: 7,  h: 11, minW: 4, minH: 4 },
      { i: 'sound',    x: 0,  y: 17, w: 9,  h: 5,  minW: 3, minH: 3 },
    ],
  },
  {
    // Hardware full-width top, 4 equal columns below
    // Cols  0-7:  hardware(h=11) + spotify(h=11)  = 22
    // Cols  8-15: hardware(h=11) + calendar(h=11) = 22
    // Cols 16-19: stocks(h=11)   + weather(h=11)  = 22
    // Cols 20-23: stocks(h=11)   + sound(h=11)    = 22
    name: 'System',
    layout: [
      { i: 'hardware', x: 0,  y: 0,  w: 16, h: 11, minW: 6, minH: 4 },
      { i: 'stocks',   x: 16, y: 0,  w: 8,  h: 11, minW: 5, minH: 5 },
      { i: 'spotify',  x: 0,  y: 11, w: 8,  h: 11, minW: 4, minH: 5 },
      { i: 'calendar', x: 8,  y: 11, w: 8,  h: 11, minW: 4, minH: 4 },
      { i: 'weather',  x: 16, y: 11, w: 4,  h: 11, minW: 4, minH: 4 },
      { i: 'sound',    x: 20, y: 11, w: 4,  h: 11, minW: 3, minH: 3 },
    ],
  },
  {
    // Spotify hero left, stocks wide top-right, calendar mid-right
    // Cols  0-9:  spotify(h=17)  + hardware(h=5)  = 22
    // Cols 10-17: stocks(h=12)   + calendar(h=10) = 22
    // Cols 18-23: stocks(h=12)   + weather(h=5)   + sound(h=5) = 22
    name: 'Focus',
    layout: [
      { i: 'spotify',  x: 0,  y: 0,  w: 10, h: 17, minW: 4, minH: 5 },
      { i: 'stocks',   x: 10, y: 0,  w: 14, h: 12, minW: 5, minH: 5 },
      { i: 'calendar', x: 10, y: 12, w: 8,  h: 10, minW: 4, minH: 4 },
      { i: 'weather',  x: 18, y: 12, w: 6,  h: 5,  minW: 4, minH: 4 },
      { i: 'sound',    x: 18, y: 17, w: 6,  h: 5,  minW: 3, minH: 3 },
      { i: 'hardware', x: 0,  y: 17, w: 10, h: 5,  minW: 6, minH: 4 },
    ],
  },
  {
    // Info + calendar stacked left, stocks mid, spotify full-height right
    // Cols  0-6:  weather(h=6) + hardware(h=7) + calendar(h=9) = 22
    // Cols  7-14: stocks(h=15) + sound(h=7)                    = 22
    // Cols 15-23: spotify(h=22)                                 = 22
    name: 'Chill',
    layout: [
      { i: 'weather',  x: 0,  y: 0,  w: 7,  h: 6,  minW: 4, minH: 4 },
      { i: 'hardware', x: 0,  y: 6,  w: 7,  h: 7,  minW: 6, minH: 4 },
      { i: 'calendar', x: 0,  y: 13, w: 7,  h: 9,  minW: 4, minH: 4 },
      { i: 'stocks',   x: 7,  y: 0,  w: 8,  h: 15, minW: 5, minH: 5 },
      { i: 'sound',    x: 7,  y: 15, w: 8,  h: 7,  minW: 3, minH: 3 },
      { i: 'spotify',  x: 15, y: 0,  w: 9,  h: 22, minW: 4, minH: 5 },
    ],
  },
  {
    // Two big horizontal rows
    // Cols  0-11: stocks(h=11)   + hardware(h=11) = 22
    // Cols 10-16: stocks(h=11)   + sound(h=5)     + calendar(h=6) = 22  [overlap with stocks cols 10-11]
    // Cols 12-23: spotify(h=11)  + ...
    // Simpler split:
    // Cols  0-9:  stocks(h=11)   + hardware(h=11) = 22
    // Cols 10-16: stocks(h=11)   + sound(h=5)     + calendar(h=6) = 22
    // Cols 17-23: spotify(h=11)  + weather(h=11)  = 22
    // — stocks w=17 covers cols 0-16, spotify w=12 covers cols 12-23? No, overlap.
    //
    // Clean version:
    // Cols  0-11: stocks(h=11)   + hardware(h=11) = 22
    // Cols 12-18: spotify(h=11)  + sound(h=5)     + calendar(h=6) = 22
    // Cols 19-23: spotify(h=11)  + weather(h=11)  = 22
    name: 'Wide',
    layout: [
      { i: 'stocks',   x: 0,  y: 0,  w: 12, h: 11, minW: 5, minH: 5 },
      { i: 'spotify',  x: 12, y: 0,  w: 12, h: 11, minW: 4, minH: 5 },
      { i: 'hardware', x: 0,  y: 11, w: 12, h: 11, minW: 6, minH: 4 },
      { i: 'sound',    x: 12, y: 11, w: 7,  h: 5,  minW: 3, minH: 3 },
      { i: 'calendar', x: 12, y: 16, w: 7,  h: 6,  minW: 4, minH: 4 },
      { i: 'weather',  x: 19, y: 11, w: 5,  h: 11, minW: 4, minH: 4 },
    ],
  },
];

export const DEFAULT_LAYOUT = PRESETS[0];
