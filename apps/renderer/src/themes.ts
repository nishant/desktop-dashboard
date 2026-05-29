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
  | 'arctic';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  swatch: string; // preview dot color (plain CSS color, not a token)
}

export const THEMES: ThemeDef[] = [
  { id: 'midnight',  name: 'Midnight',  swatch: '#27272a' },
  { id: 'slate',     name: 'Slate',     swatch: '#f1f5f9' },
  { id: 'ocean',     name: 'Ocean',     swatch: '#0a2338' },
  { id: 'contrast',  name: 'Contrast',  swatch: '#111111' },
  { id: 'rose',      name: 'Rose',      swatch: '#3f1c32' },
  { id: 'forest',    name: 'Forest',    swatch: '#14261c' },
  { id: 'sunset',    name: 'Sunset',    swatch: '#301a0f' },
  { id: 'dracula',   name: 'Dracula',   swatch: '#282a36' },
  { id: 'nord',      name: 'Nord',      swatch: '#3b4252' },
  { id: 'solarized', name: 'Solarized', swatch: '#fdf6e3' },
  { id: 'crimson',   name: 'Crimson',   swatch: '#2e1014' },
  { id: 'mocha',     name: 'Mocha',     swatch: '#32271e' },
  { id: 'neon',      name: 'Neon',      swatch: '#1a142c' },
  { id: 'sandstorm', name: 'Sandstorm', swatch: '#f5f0e6' },
  { id: 'arctic',    name: 'Arctic',    swatch: '#f0f7ff' },
];
