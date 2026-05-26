import { LayoutGrid } from 'lucide-react';
import { PRESETS } from '../lib/layouts';
import { useLayoutStore } from '../store/layoutStore';
import { cn } from '../lib/utils';

// Keep in sync with TITLEBAR_H in DashboardGrid.tsx
export const TITLEBAR_H = 32;

// Electron frameless window drag region.
// The entire bar is draggable; buttons opt out with no-drag.
const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export function Titlebar() {
  const { activePreset, applyPreset } = useLayoutStore();

  return (
    <div
      style={dragStyle}
      className="h-8 flex items-center gap-3 px-3 bg-zinc-950 border-b border-zinc-800/50 shrink-0 select-none"
    >
      {/* Brand */}
      <span className="text-zinc-700 text-[11px] font-semibold tracking-[0.2em] uppercase">
        nishboard
      </span>

      <div className="flex-1" />

      {/* Layout presets */}
      <div style={noDragStyle} className="flex items-center gap-0.5">
        <LayoutGrid className="w-3 h-3 text-zinc-700 mr-1 shrink-0" />
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset.name)}
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
              activePreset === preset.name
                ? 'bg-zinc-800 text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60',
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
