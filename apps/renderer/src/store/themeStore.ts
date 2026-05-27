import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from '../themes';

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'midnight',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'dashboard-theme' },
  ),
);
