import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from '../themes';

export interface CustomColors {
  primary:   string; // '#rrggbb' — page background
  secondary: string; // '#rrggbb' — card / tile background
  tertiary:  string; // '#rrggbb' — borders, small elements
  text:      string; // '#rrggbb' — primary text
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
  setTheme: (theme: ThemeId) => void;
  setCustomColors: (colors: CustomColors) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'midnight',
      customColors: DEFAULT_CUSTOM,
      setTheme: (theme) => set({ theme }),
      setCustomColors: (customColors) => set({ customColors }),
    }),
    { name: 'dashboard-theme' },
  ),
);
