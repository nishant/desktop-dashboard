import { useState } from 'react';
import { Volume2, VolumeX, Volume1, Volume } from 'lucide-react';
import { useSound, useSetVolume, useSetMute, useSwitchDevice, useSetSessionVolume } from './useSound';
import type { AudioDevice, AudioSession } from '@dash/shared';

function VolumeIcon({ vol, muted }: { vol: number; muted: boolean }) {
  if (muted || vol === 0) return <VolumeX size={14} className="shrink-0" />;
  if (vol < 33) return <Volume size={14} className="shrink-0" />;
  if (vol < 66) return <Volume1 size={14} className="shrink-0" />;
  return <Volume2 size={14} className="shrink-0" />;
}

function VolumeSlider({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const display = dragging ?? value;

  return (
    <input
      type="range"
      min={0}
      max={100}
      value={display}
      disabled={disabled}
      onChange={(e) => setDragging(Number(e.target.value))}
      onPointerUp={() => {
        if (dragging !== null) {
          onChange(dragging);
          setDragging(null);
        }
      }}
      className="w-full h-1 rounded-full appearance-none cursor-pointer
        bg-zinc-700 accent-zinc-300
        disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

function DeviceItem({
  device,
  onSwitch,
  switching,
}: {
  device: AudioDevice;
  onSwitch: (id: string) => void;
  switching: boolean;
}) {
  return (
    <button
      onClick={() => !device.isDefault && onSwitch(device.id)}
      disabled={device.isDefault || switching}
      className={[
        'w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2',
        device.isDefault
          ? 'bg-zinc-700/50 text-white cursor-default'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full shrink-0',
          device.isDefault ? 'bg-emerald-400' : 'bg-zinc-600',
        ].join(' ')}
      />
      <span className="truncate">{device.name}</span>
    </button>
  );
}

function SessionRow({ session, onCommit }: { session: AudioSession; onCommit: (pid: number, vol: number) => void }) {
  const [dragging, setDragging] = useState<number | null>(null);
  const vol = dragging ?? session.volumePercent;

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-zinc-400 text-[11px] truncate w-28 shrink-0 group-hover:text-zinc-200 transition-colors">
        {session.name}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={vol}
        onChange={(e) => setDragging(Number(e.target.value))}
        onPointerUp={() => {
          if (dragging !== null) {
            onCommit(session.pid, dragging);
            setDragging(null);
          }
        }}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-zinc-400"
      />
      <span className="text-zinc-500 text-[10px] tabular-nums font-mono w-7 text-right shrink-0">
        {vol}%
      </span>
    </div>
  );
}

export function SoundWidget() {
  const { data, isLoading, isError } = useSound();
  const setVolume = useSetVolume();
  const setMute = useSetMute();
  const switchDevice = useSwitchDevice();
  const setSessionVolume = useSetSessionVolume();

  const muted = data?.muted ?? false;
  const vol = data?.volumePercent ?? 0;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm">
        Sound unavailable
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-y-auto">

      {/* ── Master volume ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMute.mutate(!muted)}
            className={[
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              muted ? 'text-red-400 hover:text-red-300' : 'text-zinc-300 hover:text-white',
            ].join(' ')}
          >
            <VolumeIcon vol={vol} muted={muted} />
            Volume
          </button>
          <span className="text-[11px] tabular-nums text-zinc-500 font-mono">
            {muted ? 'muted' : `${vol}%`}
          </span>
        </div>
        <VolumeSlider
          value={vol}
          disabled={muted}
          onChange={(v) => setVolume.mutate(v)}
        />
      </div>

      {/* ── Output device ── */}
      {data.devices.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-600 px-0.5">Output</span>
          {data.devices.map((d) => (
            <DeviceItem
              key={d.id}
              device={d}
              onSwitch={(id) => switchDevice.mutate(id)}
              switching={switchDevice.isPending}
            />
          ))}
        </div>
      )}

      {/* ── App mixer (Windows only) ── */}
      {data.sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-600 px-0.5">
            App Mixer
          </span>
          {data.sessions.map((s) => (
            <SessionRow
              key={s.pid}
              session={s}
              onCommit={(pid, volumePercent) => setSessionVolume.mutate({ pid, volumePercent })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
