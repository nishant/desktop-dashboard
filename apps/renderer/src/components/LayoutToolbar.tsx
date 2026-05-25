import { LayoutGrid } from 'lucide-react';
import { PRESETS } from '../lib/layouts';
import { useLayoutStore } from '../store/layoutStore';
import { cn } from '../lib/utils';

export function LayoutToolbar() {
  const { activePreset, applyPreset } = useLayoutStore();

  return (
    <div className="fixed top-2 right-2 z-50 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-800 px-2 py-1.5 shadow-xl">
      <LayoutGrid className="w-3.5 h-3.5 text-zinc-600 mr-1 shrink-0" />
      {PRESETS.map((preset) => (
        <button
          key={preset.name}
          onClick={() => applyPreset(preset.name)}
          className={cn(
            'px-2.5 py-1 rounded text-xs font-medium transition-colors',
            activePreset === preset.name
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
          )}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}
