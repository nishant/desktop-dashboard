import { useState, useEffect } from 'react';
import { LayoutGrid, Pin } from 'lucide-react';
import { PRESETS } from '../lib/layouts';
import { useLayoutStore } from '../store/layoutStore';
import { cn } from '../lib/utils';

export const TITLEBAR_H = 32;

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

// ── Clock ─────────────────────────────────────────────────────────────────────

function formatClock(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('weekday')} ${get('month')} ${get('day')} ${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
}

function useClock() {
  const [str, setStr] = useState(() => formatClock(new Date()));
  useEffect(() => {
    const id = setInterval(() => setStr(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return str;
}

// ── Titlebar ──────────────────────────────────────────────────────────────────

export function Titlebar() {
  const { activePreset, applyPreset, pinnedPresets, pinPreset, unpinPreset } = useLayoutStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const clock = useClock();

  return (
    <div
      style={dragStyle}
      className="h-8 relative flex items-center px-3 bg-zinc-950 border-b border-zinc-800/50 shrink-0 select-none"
    >
      {/* Left: brand + pinned preset buttons */}
      <div className="flex items-center gap-1">
        <span className="text-zinc-700 text-[11px] font-semibold tracking-[0.2em] uppercase shrink-0 mr-1.5">
          nishboard
        </span>
        <div style={noDragStyle} className="flex items-center gap-0.5">
          {pinnedPresets.map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                activePreset === name
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60',
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Center: clock — absolute so it's always perfectly centred */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-zinc-500 text-[11px] tabular-nums">
          {clock}
        </span>
      </div>

      {/* Right: layout menu */}
      <div className="ml-auto relative" style={noDragStyle}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors',
            menuOpen
              ? 'bg-zinc-800 text-zinc-300'
              : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60',
          )}
        >
          <LayoutGrid size={11} />
          Layouts
        </button>

        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              style={noDragStyle}
              onClick={() => setMenuOpen(false)}
            />
            {/* Dropdown */}
            <div
              className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 min-w-[148px]"
              style={noDragStyle}
            >
              {PRESETS.map((preset) => {
                const pinned = pinnedPresets.includes(preset.name);
                const active = activePreset === preset.name;
                return (
                  <div key={preset.name} className="flex items-center gap-1 px-1 group">
                    <button
                      onClick={() => { applyPreset(preset.name); setMenuOpen(false); }}
                      className={cn(
                        'flex-1 text-left px-2 py-1 rounded text-[11px] transition-colors',
                        active
                          ? 'text-zinc-100 bg-zinc-800'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60',
                      )}
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => (pinned ? unpinPreset(preset.name) : pinPreset(preset.name))}
                      title={pinned ? 'Unpin from bar' : 'Pin to bar'}
                      className={cn(
                        'p-1 rounded transition-colors shrink-0',
                        pinned
                          ? 'text-zinc-300 hover:text-red-400'
                          : 'text-zinc-700 hover:text-zinc-400 opacity-0 group-hover:opacity-100',
                      )}
                    >
                      <Pin size={10} className={pinned ? 'fill-current' : ''} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
