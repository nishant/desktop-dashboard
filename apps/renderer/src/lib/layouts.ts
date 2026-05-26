import type { Layout } from 'react-grid-layout';

export type WidgetId = 'weather' | 'spotify' | 'stocks' | 'hardware' | 'sound' | 'calendar' | 'youtube';

export const ALL_WIDGET_IDS: WidgetId[] = [
  'weather', 'spotify', 'stocks', 'hardware', 'sound', 'calendar', 'youtube',
];

export interface NamedLayout {
  name: string;
  layout: Layout[];
}

// 24 cols, dynamic rowHeight (fills screen minus titlebar), margin=[8,8], containerPadding=[8,8]
// Every preset is gap-free — all 24×22 cells covered by exactly one widget.
// Verification: for each column x, sum of h values of widgets covering that x = 22.

export const PRESETS: NamedLayout[] = [
  {
    // 4 top (h=8) + youtube+sound mid (h=9) + hardware full-width bottom (h=5)
    // Cols  0-5:  weather(8)  + youtube(9)   + hardware(5) = 22
    // Cols  6-11: spotify(8)  + youtube(9)   + hardware(5) = 22
    // Cols 12-13: stocks(8)   + youtube(9)   + hardware(5) = 22
    // Cols 14-23: calendar(8) + sound(9)     + hardware(5) = 22
    name: 'Default',
    layout: [
      { i: 'weather',  x: 0,  y: 0,  w: 6,  h: 8,  minW: 4, minH: 4 },
      { i: 'spotify',  x: 6,  y: 0,  w: 6,  h: 8,  minW: 4, minH: 5 },
      { i: 'stocks',   x: 12, y: 0,  w: 6,  h: 8,  minW: 5, minH: 5 },
      { i: 'calendar', x: 18, y: 0,  w: 6,  h: 8,  minW: 4, minH: 4 },
      { i: 'youtube',  x: 0,  y: 8,  w: 14, h: 9,  minW: 6, minH: 6 },
      { i: 'sound',    x: 14, y: 8,  w: 10, h: 9,  minW: 3, minH: 3 },
      { i: 'hardware', x: 0,  y: 17, w: 24, h: 5,  minW: 6, minH: 4 },
    ],
  },
  {
    // Stocks + youtube equal top (h=12), info grid below (h=10)
    // Cols  0-11: stocks(12)  + hardware(10) = 22
    // Cols 12-17: youtube(12) + spotify(6)   + weather(4) = 22
    // Cols 18-23: youtube(12) + calendar(6)  + sound(4)   = 22
    name: 'Markets',
    layout: [
      { i: 'stocks',   x: 0,  y: 0,  w: 12, h: 12, minW: 5, minH: 5 },
      { i: 'youtube',  x: 12, y: 0,  w: 12, h: 12, minW: 6, minH: 6 },
      { i: 'hardware', x: 0,  y: 12, w: 12, h: 10, minW: 6, minH: 4 },
      { i: 'spotify',  x: 12, y: 12, w: 6,  h: 6,  minW: 4, minH: 5 },
      { i: 'calendar', x: 18, y: 12, w: 6,  h: 6,  minW: 4, minH: 4 },
      { i: 'weather',  x: 12, y: 18, w: 6,  h: 4,  minW: 4, minH: 4 },
      { i: 'sound',    x: 18, y: 18, w: 6,  h: 4,  minW: 3, minH: 3 },
    ],
  },
  {
    // Spotify left, youtube top-right wide, small widgets bottom
    // Cols  0-8:  spotify(15) + sound(7)     = 22
    // Cols  9-23: youtube(11) + stocks(6)    + hardware(5) = 22  [9-16]
    // Cols 17-23: youtube(11) + weather(5)   + calendar(6)       [17-23]
    // Corrected:
    // Cols  0-8:  spotify(15) + sound(7)   = 22
    // Cols  9-16: youtube(11) + stocks(6)  + hardware(5) = 22
    // Cols 17-23: youtube(11) + weather(5) + calendar(6) = 22
    name: 'Media',
    layout: [
      { i: 'spotify',  x: 0,  y: 0,  w: 9,  h: 15, minW: 4, minH: 5 },
      { i: 'youtube',  x: 9,  y: 0,  w: 15, h: 11, minW: 6, minH: 6 },
      { i: 'stocks',   x: 9,  y: 11, w: 8,  h: 6,  minW: 5, minH: 5 },
      { i: 'hardware', x: 17, y: 11, w: 7,  h: 6,  minW: 6, minH: 4 },
      { i: 'weather',  x: 9,  y: 17, w: 8,  h: 5,  minW: 4, minH: 4 },
      { i: 'calendar', x: 17, y: 17, w: 7,  h: 5,  minW: 4, minH: 4 },
      { i: 'sound',    x: 0,  y: 15, w: 9,  h: 7,  minW: 3, minH: 3 },
    ],
  },
  {
    // Hardware + youtube top, 5 cols below
    // Cols  0-13: hardware(11) + spotify(6)  + weather(5)  = 22  [0-5: hardware+spotify+weather, 6-13: hardware+spotify+calendar]
    // Corrected:
    // Cols  0-13: hardware(11) + spotify(6)   + weather(5)  = 22  — actually need to check per-column
    // Cols  0-5:  hardware(11) + spotify(6)   + weather(5)  = 22
    // Cols  6-13: hardware(11) + spotify(6)   + calendar(5) = 22  [hmm spotify w=6 starts at x=0]
    // Let me redo: hardware x=0 w=14, youtube x=14 w=10
    // spotify x=0 w=6, calendar x=6 w=8, stocks x=14 w=5, weather x=19 w=5, sound x=14 w=10 (bottom row)
    // Cols  0-5:  hardware(11) + spotify(6)   + weather(5)  = 22
    // Cols  6-13: hardware(11) + calendar(6)  + sound(5)    = 22  [calendar w=8 covers 6-13, sound x=14 w=10 covers 14-23]
    // Cols 14-18: youtube(11)  + stocks(6)    + sound(5)    = 22
    // Cols 19-23: youtube(11)  + weather(6)   + sound(5)    = 22
    // Wait — let me be more careful. stocks x=14 w=5, weather x=19 w=5 in bottom left, sound x=14 w=10 in bottom row
    // Cols 14-18: youtube(11) + stocks(6) + sound(5) = 22 ✓
    // Cols 19-23: youtube(11) + weather(6) + sound(5) = 22 ✓
    // Cols 6-13: hardware(11) + calendar(6) + ??? — calendar h=6 ends at y=17, need 5 more rows. sound x=14 doesn't cover cols 6-13.
    // Need to rethink. Let me use the plan from summary:
    // hardware: x=0 y=0 w=14 h=11, youtube: x=14 y=0 w=10 h=11
    // spotify: x=0 y=11 w=6 h=11, calendar: x=6 y=11 w=8 h=11
    // stocks: x=14 y=11 w=5 h=6, weather: x=19 y=11 w=5 h=6
    // sound: x=14 y=17 w=10 h=5
    // Cols 0-5: hardware(11) + spotify(11) = 22 ✓
    // Cols 6-13: hardware(11) + calendar(11) = 22 ✓
    // Cols 14-18: youtube(11) + stocks(6) + sound(5) = 22 ✓
    // Cols 19-23: youtube(11) + weather(6) + sound(5) = 22 ✓
    name: 'System',
    layout: [
      { i: 'hardware', x: 0,  y: 0,  w: 14, h: 11, minW: 6, minH: 4 },
      { i: 'youtube',  x: 14, y: 0,  w: 10, h: 11, minW: 6, minH: 6 },
      { i: 'spotify',  x: 0,  y: 11, w: 6,  h: 11, minW: 4, minH: 5 },
      { i: 'calendar', x: 6,  y: 11, w: 8,  h: 11, minW: 4, minH: 4 },
      { i: 'stocks',   x: 14, y: 11, w: 5,  h: 6,  minW: 5, minH: 5 },
      { i: 'weather',  x: 19, y: 11, w: 5,  h: 6,  minW: 4, minH: 4 },
      { i: 'sound',    x: 14, y: 17, w: 10, h: 5,  minW: 3, minH: 3 },
    ],
  },
  {
    // Spotify full-height left, youtube center-top, stocks right
    // spotify: x=0 y=0 w=8 h=22
    // youtube: x=8 y=0 w=10 h=11, stocks: x=18 y=0 w=6 h=11
    // hardware: x=8 y=11 w=6 h=11, calendar: x=14 y=11 w=5 h=11 — wait that only covers 14-18
    // Let me use the summary plan:
    // spotify: x=0 w=8 h=22
    // youtube: x=8 w=10 h=11, stocks: x=18 w=6 h=11
    // hardware: x=8 w=6 h=11, weather: x=14 w=5 h=6, sound: x=14 w=5 h=5, calendar: x=19 w=5 h=11
    // Cols 0-7: spotify(22) = 22 ✓
    // Cols 8-13: youtube(11) + hardware(11) = 22 ✓
    // Cols 14-18: youtube(11) + weather(6) + sound(5) = 22 ✓
    // Cols 19-23: stocks(11) + calendar(11) = 22 ✓
    name: 'Focus',
    layout: [
      { i: 'spotify',  x: 0,  y: 0,  w: 8,  h: 22, minW: 4, minH: 5 },
      { i: 'youtube',  x: 8,  y: 0,  w: 10, h: 11, minW: 6, minH: 6 },
      { i: 'stocks',   x: 18, y: 0,  w: 6,  h: 11, minW: 5, minH: 5 },
      { i: 'hardware', x: 8,  y: 11, w: 6,  h: 11, minW: 6, minH: 4 },
      { i: 'weather',  x: 14, y: 11, w: 5,  h: 6,  minW: 4, minH: 4 },
      { i: 'sound',    x: 14, y: 17, w: 5,  h: 5,  minW: 3, minH: 3 },
      { i: 'calendar', x: 19, y: 11, w: 5,  h: 11, minW: 4, minH: 4 },
    ],
  },
  {
    // Info stack left, stocks+sound mid, youtube full-height, spotify full-height
    // weather: x=0 w=5 h=7, hardware: x=0 w=5 h=8, calendar: x=0 w=5 h=7
    // stocks: x=5 w=6 h=14, sound: x=5 w=6 h=8
    // youtube: x=11 w=7 h=22
    // spotify: x=18 w=6 h=22
    // Cols 0-4: weather(7) + hardware(8) + calendar(7) = 22 ✓
    // Cols 5-10: stocks(14) + sound(8) = 22 ✓
    // Cols 11-17: youtube(22) = 22 ✓
    // Cols 18-23: spotify(22) = 22 ✓
    name: 'Chill',
    layout: [
      { i: 'weather',  x: 0,  y: 0,  w: 5,  h: 7,  minW: 4, minH: 4 },
      { i: 'hardware', x: 0,  y: 7,  w: 5,  h: 8,  minW: 6, minH: 4 },
      { i: 'calendar', x: 0,  y: 15, w: 5,  h: 7,  minW: 4, minH: 4 },
      { i: 'stocks',   x: 5,  y: 0,  w: 6,  h: 14, minW: 5, minH: 5 },
      { i: 'sound',    x: 5,  y: 14, w: 6,  h: 8,  minW: 3, minH: 3 },
      { i: 'youtube',  x: 11, y: 0,  w: 7,  h: 22, minW: 6, minH: 6 },
      { i: 'spotify',  x: 18, y: 0,  w: 6,  h: 22, minW: 4, minH: 5 },
    ],
  },
  {
    // Stocks + youtube equal top row, everything below
    // stocks: x=0 w=12 h=11, youtube: x=12 w=12 h=11
    // hardware: x=0 w=9 h=11, spotify: x=9 w=7 h=11
    // weather: x=16 w=4 h=6, sound: x=16 w=4 h=5, calendar: x=20 w=4 h=11
    // Cols 0-8: stocks(11) + hardware(11) = 22 ✓
    // Cols 9-15: stocks(11) + spotify(11) = 22 ✓
    // Cols 12-15: youtube(11) + spotify(11) = 22 — wait, stocks covers 0-11 (w=12), youtube covers 12-23 (w=12)
    // Cols 9-11: stocks(11) + spotify(11) = 22 ✓
    // Cols 12-15: youtube(11) + spotify(11) = 22 ✓  (spotify x=9 w=7 covers 9-15)
    // Cols 16-19: youtube(11) + weather(6) + sound(5) = 22 ✓
    // Cols 20-23: youtube(11) + calendar(11) = 22 ✓
    name: 'Wide',
    layout: [
      { i: 'stocks',   x: 0,  y: 0,  w: 12, h: 11, minW: 5, minH: 5 },
      { i: 'youtube',  x: 12, y: 0,  w: 12, h: 11, minW: 6, minH: 6 },
      { i: 'hardware', x: 0,  y: 11, w: 9,  h: 11, minW: 6, minH: 4 },
      { i: 'spotify',  x: 9,  y: 11, w: 7,  h: 11, minW: 4, minH: 5 },
      { i: 'weather',  x: 16, y: 11, w: 4,  h: 6,  minW: 4, minH: 4 },
      { i: 'sound',    x: 16, y: 17, w: 4,  h: 5,  minW: 3, minH: 3 },
      { i: 'calendar', x: 20, y: 11, w: 4,  h: 11, minW: 4, minH: 4 },
    ],
  },
  {
    // YouTube player hero left, supporting widgets right + bottom.
    // Cols  0-13: youtube(14) + hardware(8)               = 22
    // Cols 14-19: spotify(8)  + stocks(6)  + calendar(8) = 22
    // Cols 20-23: spotify(8)  + stocks(6)  + weather(4) + sound(4) = 22
    name: 'YouTube',
    layout: [
      { i: 'youtube',  x: 0,  y: 0,  w: 14, h: 14, minW: 6, minH: 6 },
      { i: 'spotify',  x: 14, y: 0,  w: 10, h: 8,  minW: 4, minH: 5 },
      { i: 'stocks',   x: 14, y: 8,  w: 10, h: 6,  minW: 5, minH: 5 },
      { i: 'hardware', x: 0,  y: 14, w: 14, h: 8,  minW: 6, minH: 4 },
      { i: 'calendar', x: 14, y: 14, w: 6,  h: 8,  minW: 4, minH: 4 },
      { i: 'weather',  x: 20, y: 14, w: 4,  h: 4,  minW: 4, minH: 4 },
      { i: 'sound',    x: 20, y: 18, w: 4,  h: 4,  minW: 3, minH: 3 },
    ],
  },
];

export const DEFAULT_LAYOUT = PRESETS[0];

// Appends any widget IDs missing from a stored/custom layout to the bottom row.
// Ensures new widgets added to ALL_WIDGET_IDS automatically appear on load.
export function autoFillLayout(layout: Layout[]): Layout[] {
  const existing = new Set(layout.map((item) => item.i));
  const missing = ALL_WIDGET_IDS.filter((id) => !existing.has(id));
  if (missing.length === 0) return layout;
  const maxY = Math.max(...layout.map((item) => item.y + item.h), 0);
  const w = Math.floor(24 / missing.length);
  return [
    ...layout,
    ...missing.map((id, i) => ({
      i: id,
      x: i * w,
      y: maxY,
      w,
      h: 6,
      minW: 4,
      minH: 3,
    })),
  ];
}
