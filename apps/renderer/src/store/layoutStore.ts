import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';
import { DEFAULT_LAYOUT, PRESETS, autoFillLayout } from '../lib/layouts';

interface LayoutState {
  layout: Layout[];
  activePreset: string | null;
  pinnedPresets: string[];
  setLayout: (layout: Layout[]) => void;
  applyPreset: (name: string) => void;
  resetToDefault: () => void;
  pinPreset: (name: string) => void;
  unpinPreset: (name: string) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layout: autoFillLayout(DEFAULT_LAYOUT.layout),
      activePreset: DEFAULT_LAYOUT.name,
      pinnedPresets: [],

      setLayout: (layout) => set({ layout, activePreset: null }),

      applyPreset: (name) => {
        const preset = PRESETS.find((p) => p.name === name);
        if (preset) set({ layout: autoFillLayout(preset.layout), activePreset: name });
      },

      resetToDefault: () =>
        set({ layout: autoFillLayout(DEFAULT_LAYOUT.layout), activePreset: DEFAULT_LAYOUT.name }),

      pinPreset: (name) =>
        set((s) => ({
          pinnedPresets: s.pinnedPresets.includes(name)
            ? s.pinnedPresets
            : [...s.pinnedPresets, name],
        })),

      unpinPreset: (name) =>
        set((s) => ({ pinnedPresets: s.pinnedPresets.filter((p) => p !== name) })),
    }),
    {
      name: 'dashboard-layout',
      onRehydrateStorage: () => (state) => {
        if (state) state.layout = autoFillLayout(state.layout);
      },
    }
  )
);
