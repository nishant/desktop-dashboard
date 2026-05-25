import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';
import { DEFAULT_LAYOUT, PRESETS } from '../lib/layouts';

interface LayoutState {
  layout: Layout[];
  activePreset: string | null;
  setLayout: (layout: Layout[]) => void;
  applyPreset: (name: string) => void;
  resetToDefault: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layout: DEFAULT_LAYOUT.layout,
      activePreset: DEFAULT_LAYOUT.name,

      setLayout: (layout) => set({ layout, activePreset: null }),

      applyPreset: (name) => {
        const preset = PRESETS.find((p) => p.name === name);
        if (preset) set({ layout: preset.layout, activePreset: name });
      },

      resetToDefault: () =>
        set({ layout: DEFAULT_LAYOUT.layout, activePreset: DEFAULT_LAYOUT.name }),
    }),
    { name: 'dashboard-layout' }
  )
);
