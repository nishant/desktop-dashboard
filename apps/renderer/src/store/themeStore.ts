import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from '../themes';

export interface CustomColors {
  primary:   string; // '#rrggbb' — page background
  secondary: string; // '#rrggbb' — card / tile background
  tertiary:  string; // '#rrggbb' — borders, small elements
  text:      string; // '#rrggbb' — primary text
}

export interface SavedCustomTheme {
  id: string;
  name: string;
  colors: CustomColors;
}

const DEFAULT_CUSTOM: CustomColors = {
  primary:   '#18181b', // zinc-900
  secondary: '#27272a', // zinc-800
  tertiary:  '#3f3f46', // zinc-700
  text:      '#ffffff',
};

interface ThemeState {
  theme: ThemeId;
  customColors: CustomColors;
  savedCustomThemes: SavedCustomTheme[];
  activeCustomId: string | null; // id of the saved theme that's active, or null if unsaved

  setTheme: (theme: ThemeId) => void;
  /** Update working colors. Clears activeCustomId (colors are now "unsaved"). */
  setCustomColors: (colors: CustomColors) => void;
  /** Save current customColors under a name; sets theme='custom' and activeCustomId. */
  saveCustomTheme: (name: string) => void;
  /** Remove a saved theme by id. */
  deleteCustomTheme: (id: string) => void;
  /** Load a saved theme's colors into customColors and activate it. */
  applyCustomTheme: (id: string) => void;
  /** Overwrite an existing saved theme's colors with the current customColors. */
  updateCustomTheme: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'midnight',
      customColors: DEFAULT_CUSTOM,
      savedCustomThemes: [],
      activeCustomId: null,

      setTheme: (theme) => set({ theme }),

      setCustomColors: (customColors) => set({ customColors, activeCustomId: null }),

      saveCustomTheme: (name) =>
        set((s) => {
          const id = crypto.randomUUID();
          return {
            savedCustomThemes: [...s.savedCustomThemes, { id, name, colors: s.customColors }],
            activeCustomId: id,
            theme: 'custom',
          };
        }),

      deleteCustomTheme: (id) =>
        set((s) => ({
          savedCustomThemes: s.savedCustomThemes.filter((t) => t.id !== id),
          activeCustomId: s.activeCustomId === id ? null : s.activeCustomId,
        })),

      applyCustomTheme: (id) =>
        set((s) => {
          const found = s.savedCustomThemes.find((t) => t.id === id);
          if (!found) return s;
          return { theme: 'custom', customColors: found.colors, activeCustomId: id };
        }),

      updateCustomTheme: (id) =>
        set((s) => ({
          savedCustomThemes: s.savedCustomThemes.map((t) =>
            t.id === id ? { ...t, colors: { ...s.customColors } } : t,
          ),
          activeCustomId: id,
          theme: 'custom',
        })),
    }),
    { name: 'dashboard-theme' },
  ),
);
