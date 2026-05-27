import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';
import { DEFAULT_LAYOUT, PRESETS, autoFillLayout, ALL_WIDGET_IDS } from '../lib/layouts';
import type { WidgetId } from '../lib/layouts';

interface LayoutState {
  layout: Layout[];
  activePreset: string | null;
  pinnedPresets: string[];
  visibleWidgets: WidgetId[];
  setLayout: (layout: Layout[]) => void;
  applyPreset: (name: string) => void;
  resetToDefault: () => void;
  pinPreset: (name: string) => void;
  unpinPreset: (name: string) => void;
  showWidget: (id: WidgetId) => void;
  hideWidget: (id: WidgetId) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layout: autoFillLayout(DEFAULT_LAYOUT.layout),
      activePreset: DEFAULT_LAYOUT.name,
      pinnedPresets: [],
      visibleWidgets: [...ALL_WIDGET_IDS],

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

      showWidget: (id) =>
        set((s) => ({
          visibleWidgets: s.visibleWidgets.includes(id)
            ? s.visibleWidgets
            : [...s.visibleWidgets, id],
        })),

      hideWidget: (id) =>
        set((s) => ({ visibleWidgets: s.visibleWidgets.filter((w) => w !== id) })),
    }),
    {
      name: 'dashboard-layout',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.layout = autoFillLayout(state.layout);
          // Back-fill visibleWidgets for stored states that predate this field
          if (!state.visibleWidgets || state.visibleWidgets.length === 0) {
            state.visibleWidgets = [...ALL_WIDGET_IDS];
          }
        }
      },
    }
  )
);
