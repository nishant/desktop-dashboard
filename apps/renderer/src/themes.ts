export type ThemeId =
  | 'midnight'
  | 'slate'
  | 'ocean'
  | 'contrast'
  | 'rose'
  | 'forest'
  | 'sunset'
  | 'dracula'
  | 'nord'
  | 'solarized'
  | 'crimson'
  | 'mocha'
  | 'neon'
  | 'sandstorm'
  | 'arctic'
  | 'custom';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  swatch: string; // preview dot color (plain CSS color, not a token)
}

export const THEMES: ThemeDef[] = [
  { id: 'midnight',  name: 'Midnight',  swatch: '#27272a' },
  { id: 'slate',     name: 'Slate',     swatch: '#f1f5f9' },
  { id: 'ocean',     name: 'Ocean',     swatch: '#0a2338' },
  { id: 'contrast',  name: 'Contrast',  swatch: '#facc15' }, // yellow accent — distinct from dark bg themes
  { id: 'rose',      name: 'Rose',      swatch: '#3f1c32' },
  { id: 'forest',    name: 'Forest',    swatch: '#14261c' },
  { id: 'sunset',    name: 'Sunset',    swatch: '#301a0f' },
  { id: 'dracula',   name: 'Dracula',   swatch: '#bd93f9' }, // purple accent — clearly distinct from Midnight
  { id: 'nord',      name: 'Nord',      swatch: '#88c0d0' }, // frost cyan — clearly distinct from Midnight
  { id: 'solarized', name: 'Solarized', swatch: '#fdf6e3' },
  { id: 'crimson',   name: 'Crimson',   swatch: '#2e1014' },
  { id: 'mocha',     name: 'Mocha',     swatch: '#32271e' },
  { id: 'neon',      name: 'Neon',      swatch: '#1a142c' },
  { id: 'sandstorm', name: 'Sandstorm', swatch: '#f5f0e6' },
  { id: 'arctic',    name: 'Arctic',    swatch: '#f0f7ff' },
  { id: 'custom',    name: 'Custom',    swatch: '#52525b' }, // placeholder; overridden dynamically
];
