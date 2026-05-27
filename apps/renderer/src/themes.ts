export type ThemeId = 'midnight' | 'slate' | 'ocean' | 'contrast' | 'rose';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  swatch: string; // preview dot color (plain CSS color, not a token)
}

export const THEMES: ThemeDef[] = [
  { id: 'midnight', name: 'Midnight', swatch: '#27272a' },
  { id: 'slate',    name: 'Slate',    swatch: '#f1f5f9' },
  { id: 'ocean',    name: 'Ocean',    swatch: '#0a2338' },
  { id: 'contrast', name: 'Contrast', swatch: '#111111' },
  { id: 'rose',     name: 'Rose',     swatch: '#3f1c32' },
];
