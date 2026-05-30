import { useState, useEffect } from 'react';
import { LayoutGrid, Pin, Layers, Palette, ArrowLeft, ChevronRight, Plus, X } from 'lucide-react';
import { PRESETS, ALL_WIDGET_IDS, WIDGET_TITLES } from '../lib/layouts';
import { useLayoutStore } from '../store/layoutStore';
import { useThemeStore } from '../store/themeStore';
import type { CustomColors, SavedCustomTheme } from '../store/themeStore';
import { THEMES } from '../themes';
import { parseHex } from '../lib/colorUtils';
import { cn } from '../lib/utils';
import type { WidgetId } from '../lib/layouts';

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

// ── Shared dropdown primitives ────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40" style={noDragStyle} onClick={onClose} />
  );
}

const menuBtn = (open: boolean) =>
  cn(
    'flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors',
    open
      ? 'bg-th-elevated text-th-hi'
      : 'text-th-ghost hover:text-th-hi hover:bg-th-elevated/60',
  );

const menuPanel =
  'absolute right-0 top-full mt-1 z-50 bg-th-surface border border-th-line rounded-lg shadow-xl py-1 min-w-[148px]';

// ── Layouts menu ──────────────────────────────────────────────────────────────

function LayoutsMenu() {
  const { activePreset, applyPreset, pinnedPresets, pinPreset, unpinPreset } = useLayoutStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" style={noDragStyle}>
      <button onClick={() => setOpen((o) => !o)} className={menuBtn(open)}>
        <LayoutGrid size={11} />
        Layouts
      </button>

      {open && (
        <>
          <Backdrop onClose={() => setOpen(false)} />
          <div className={menuPanel} style={noDragStyle}>
            {PRESETS.map((preset) => {
              const pinned = pinnedPresets.includes(preset.name);
              return (
                <div key={preset.name} className="flex items-center gap-1 px-1 group">
                  <button
                    onClick={() => { applyPreset(preset.name); setOpen(false); }}
                    className={cn(
                      'flex-1 text-left px-2 py-1 rounded text-[11px] transition-colors',
                      activePreset === preset.name
                        ? 'text-th-hi bg-th-elevated'
                        : 'text-th-2 hover:text-th-hi hover:bg-th-elevated/60',
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
                        ? 'text-th-2 hover:text-red-400'
                        : 'text-th-ghost hover:text-th-2 opacity-0 group-hover:opacity-100',
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
  );
}

// ── Widgets menu ──────────────────────────────────────────────────────────────

function WidgetsMenu() {
  const { visibleWidgets, showWidget, hideWidget } = useLayoutStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" style={noDragStyle}>
      <button onClick={() => setOpen((o) => !o)} className={menuBtn(open)}>
        <Layers size={11} />
        Widgets
      </button>

      {open && (
        <>
          <Backdrop onClose={() => setOpen(false)} />
          <div className={menuPanel} style={noDragStyle}>
            {ALL_WIDGET_IDS.map((id) => {
              const visible = visibleWidgets.includes(id);
              return (
                <div key={id} className="flex items-center gap-1 px-1 group">
                  <span className={cn(
                    'flex-1 px-2 py-1 text-[11px]',
                    visible ? 'text-th-2' : 'text-th-ghost',
                  )}>
                    {WIDGET_TITLES[id as WidgetId]}
                  </span>
                  <button
                    onClick={() => (visible ? hideWidget(id as WidgetId) : showWidget(id as WidgetId))}
                    title={visible ? 'Hide widget' : 'Show widget'}
                    className={cn(
                      'p-1 rounded transition-colors shrink-0',
                      visible
                        ? 'text-th-2 hover:text-red-400'
                        : 'text-th-ghost hover:text-th-2 opacity-0 group-hover:opacity-100',
                    )}
                  >
                    <Pin size={10} className={visible ? 'fill-current' : ''} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Theme menu — ColorPicker ──────────────────────────────────────────────────

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;   // '#rrggbb'
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value);
  const [error, setError] = useState(false);

  // Sync text field when value changes externally (e.g. native color picker)
  useEffect(() => { setText(value); }, [value]);

  function commit(raw: string) {
    const parsed = parseHex(raw);
    if (parsed) {
      setError(false);
      setText(parsed);
      onChange(parsed);
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-th-3 text-[10px] w-[58px] shrink-0 leading-none">{label}</span>

      {/* Native color picker visually replaced by a styled swatch */}
      <label
        className="h-5 w-5 rounded shrink-0 cursor-pointer ring-1 ring-th-line overflow-hidden relative"
        style={{ background: value }}
        title="Pick a colour"
      >
        <input
          type="color"
          value={value}
          onChange={(e) => {
            const hex = e.target.value;
            onChange(hex);
            setText(hex);
            setError(false);
          }}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
        />
      </label>

      {/* Hex / rgb text input */}
      <input
        type="text"
        value={text}
        onChange={(e) => { setText(e.target.value); setError(false); }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
        }}
        placeholder="#rrggbb"
        spellCheck={false}
        className={cn(
          'flex-1 bg-th-elevated border rounded px-2 py-0.5 text-[10px] font-mono text-th-hi',
          'placeholder:text-th-ghost focus:outline-none transition-colors',
          error ? 'border-red-400' : 'border-th-line focus:border-th-3',
        )}
      />
    </div>
  );
}

// ── Theme menu — Custom color editor ─────────────────────────────────────────

function CustomEditor({
  colors,
  onChange,
  onBack,
  onSave,
}: {
  colors: CustomColors;
  onChange: (c: CustomColors) => void;
  onBack: () => void;
  onSave: (name: string) => void;
}) {
  const [saveName, setSaveName] = useState('');

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    onSave(name);
    setSaveName('');
  }

  return (
    <div className="px-3 py-2 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onBack}
          className="text-th-ghost hover:text-th-hi transition-colors p-0.5 -ml-0.5"
        >
          <ArrowLeft size={12} />
        </button>
        <span className="text-th-hi text-[11px] font-semibold">Custom Theme</span>
      </div>

      {/* Color pickers */}
      <div className="flex flex-col gap-2.5">
        <ColorPicker
          label="Background"
          value={colors.primary}
          onChange={(v) => onChange({ ...colors, primary: v })}
        />
        <ColorPicker
          label="Cards"
          value={colors.secondary}
          onChange={(v) => onChange({ ...colors, secondary: v })}
        />
        <ColorPicker
          label="Borders"
          value={colors.tertiary}
          onChange={(v) => onChange({ ...colors, tertiary: v })}
        />
        <ColorPicker
          label="Text"
          value={colors.text}
          onChange={(v) => onChange({ ...colors, text: v })}
        />
      </div>

      {/* Save as */}
      <div className="border-t border-th-line pt-2.5 flex flex-col gap-1.5">
        <span className="text-th-ghost text-[9px] uppercase tracking-wider">Save as</span>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Theme name…"
            maxLength={32}
            className="flex-1 bg-th-elevated border border-th-line rounded px-2 py-1 text-[10px] text-th-hi placeholder:text-th-ghost focus:outline-none focus:border-th-3 transition-colors"
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="px-2.5 py-1 text-[10px] bg-th-overlay hover:bg-th-overlay/70 text-th-hi rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Save
          </button>
        </div>
      </div>

      <p className="text-th-ghost text-[9px] leading-tight -mt-1">
        Semantic colors (stocks, hardware) are preserved.
      </p>
    </div>
  );
}

// ── Theme menu — Delete confirmation modal ────────────────────────────────────

function DeleteModal({
  target,
  onConfirm,
  onCancel,
}: {
  target: SavedCustomTheme;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      style={noDragStyle}
    >
      <div className="bg-th-surface border border-th-line rounded-xl p-5 w-72 shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-th-hi text-sm font-semibold">Delete theme?</span>
          <span className="text-th-3 text-[11px] leading-relaxed">
            <span className="text-th-hi font-medium">"{target.name}"</span> will be
            permanently removed. This cannot be undone.
          </span>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-[11px] text-th-2 hover:text-th-hi bg-th-elevated hover:bg-th-overlay rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Theme menu ────────────────────────────────────────────────────────────────

type ThemePanel = 'list' | 'custom-list' | 'editor';

function ThemeMenu() {
  const {
    theme, customColors, savedCustomThemes, activeCustomId,
    setTheme, setCustomColors, saveCustomTheme, deleteCustomTheme, applyCustomTheme,
  } = useThemeStore();

  const [open, setOpen]               = useState(false);
  const [panel, setPanel]             = useState<ThemePanel>('list');
  const [deleteTarget, setDeleteTarget] = useState<SavedCustomTheme | null>(null);

  // Swatch for the button: use primary color when custom is active
  const activeSwatch =
    theme === 'custom'
      ? customColors.primary
      : (THEMES.find((t) => t.id === theme) ?? THEMES[0]).swatch;

  function handleClose() {
    setOpen(false);
    setPanel('list');
  }

  function handleToggle() {
    if (open) {
      handleClose();
    } else {
      setOpen(true);
      // If custom is active, open straight to the saved-themes list
      setPanel(theme === 'custom' ? 'custom-list' : 'list');
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteCustomTheme(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleSaveTheme(name: string) {
    saveCustomTheme(name);
    setPanel('custom-list');
  }

  return (
    <div className="relative" style={noDragStyle}>
      <button onClick={handleToggle} className={menuBtn(open)}>
        <Palette size={11} />
        Themes
        <span
          className="h-2 w-2 rounded-full shrink-0 ring-1 ring-th-line"
          style={{ background: activeSwatch }}
        />
      </button>

      {open && (
        <>
          <Backdrop onClose={handleClose} />

          <div
            className={cn(menuPanel, panel !== 'list' && 'min-w-[248px]')}
            style={noDragStyle}
          >
            {/* ── Main theme list ── */}
            {panel === 'list' && THEMES.map((t) => {
              const swatch = t.id === 'custom' ? customColors.primary : t.swatch;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (t.id === 'custom') {
                      setTheme('custom');
                      setPanel('custom-list');
                    } else {
                      setTheme(t.id);
                      handleClose();
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] transition-colors',
                    theme === t.id
                      ? 'text-th-hi bg-th-elevated'
                      : 'text-th-2 hover:text-th-hi hover:bg-th-elevated/60',
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0 ring-1 ring-white/10"
                    style={{ background: swatch }}
                  />
                  {t.name}
                  {t.id === 'custom' && (
                    <ChevronRight size={10} className="ml-auto text-th-ghost" />
                  )}
                </button>
              );
            })}

            {/* ── Custom themes submenu ── */}
            {panel === 'custom-list' && (
              <>
                {/* Header */}
                <div className="flex items-center gap-1.5 px-3 pt-1 pb-2 border-b border-th-line">
                  <button
                    onClick={() => setPanel('list')}
                    className="text-th-ghost hover:text-th-hi transition-colors p-0.5 -ml-0.5"
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <span className="text-th-3 text-[10px] uppercase tracking-wider font-medium">
                    Custom Themes
                  </span>
                </div>

                {/* Create new — always first */}
                <button
                  onClick={() => setPanel('editor')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-th-2 hover:text-th-hi hover:bg-th-elevated/60 transition-colors mt-0.5"
                >
                  <Plus size={11} className="shrink-0" />
                  Create new
                </button>

                {/* Divider + saved themes */}
                {savedCustomThemes.length > 0 && (
                  <>
                    <div className="h-px bg-th-line mx-3 my-1" />
                    {savedCustomThemes.map((t) => (
                      <div key={t.id} className="flex items-center gap-1 px-1 group">
                        <button
                          onClick={() => { applyCustomTheme(t.id); handleClose(); }}
                          className={cn(
                            'flex-1 flex items-center gap-2 px-2 py-1.5 text-[11px] rounded transition-colors min-w-0',
                            activeCustomId === t.id && theme === 'custom'
                              ? 'text-th-hi bg-th-elevated'
                              : 'text-th-2 hover:text-th-hi hover:bg-th-elevated/60',
                          )}
                        >
                          <span
                            className="h-3 w-3 rounded-full shrink-0 ring-1 ring-white/10"
                            style={{ background: t.colors.primary }}
                          />
                          <span className="truncate">{t.name}</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          title={`Delete "${t.name}"`}
                          className="p-1 rounded text-th-ghost hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* ── Color editor ── */}
            {panel === 'editor' && (
              <CustomEditor
                colors={customColors}
                onChange={(colors) => {
                  setCustomColors(colors);
                  setTheme('custom');
                }}
                onBack={() => setPanel('custom-list')}
                onSave={handleSaveTheme}
              />
            )}
          </div>

          {/* Delete confirmation modal — rendered over everything */}
          {deleteTarget && (
            <DeleteModal
              target={deleteTarget}
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeleteTarget(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Titlebar ──────────────────────────────────────────────────────────────────

export function Titlebar() {
  const { activePreset, applyPreset, pinnedPresets } = useLayoutStore();
  const clock = useClock();

  return (
    <div
      style={dragStyle}
      className="h-8 relative flex items-center px-3 bg-th-bar border-b border-th-line/50 shrink-0 select-none"
    >
      {/* Left: brand + pinned preset buttons */}
      <div className="flex items-center gap-1">
        <span className="text-th-ghost text-[11px] font-semibold tracking-[0.2em] uppercase shrink-0 mr-1.5">
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
                  ? 'bg-th-elevated text-th-hi'
                  : 'text-th-ghost hover:text-th-hi hover:bg-th-elevated/60',
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Center: clock — absolute so it's always perfectly centred */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-th-3 text-[11px] tabular-nums">{clock}</span>
      </div>

      {/* Right: theme + widget + layout menus */}
      <div className="ml-auto flex items-center gap-1">
        <ThemeMenu />
        <WidgetsMenu />
        <LayoutsMenu />
      </div>
    </div>
  );
}
