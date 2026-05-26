import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Volume1, Volume, Speaker, Headphones, Monitor } from 'lucide-react';
import { useSound, useSetVolume, useSetMute, useSwitchDevice, useSetSessionVolume } from './useSound';
import type { AudioDevice, AudioSession } from '@dash/shared';

// ── Helpers ───────────────────────────────────────────────────────────────

function VolumeIcon({ vol, muted }: { vol: number; muted: boolean }) {
  if (muted || vol === 0) return <VolumeX size={13} className="shrink-0" />;
  if (vol < 33) return <Volume size={13} className="shrink-0" />;
  if (vol < 66) return <Volume1 size={13} className="shrink-0" />;
  return <Volume2 size={13} className="shrink-0" />;
}

function DeviceTypeIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes('headphone') || lower.includes('headset') || lower.includes('wireless'))
    return <Headphones size={13} className="shrink-0" />;
  if (lower.includes('speaker'))
    return <Speaker size={13} className="shrink-0" />;
  return <Monitor size={13} className="shrink-0" />;
}

// ── Master volume slider — local optimistic state ─────────────────────────

function MasterSlider({
  value,
  muted,
  onChange,
}: {
  value: number;
  muted: boolean;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(value);
  const pointerDown = useRef(false);

  useEffect(() => {
    if (!pointerDown.current) setLocal(value);
  }, [value]);

  return (
    <input
      type="range"
      min={0}
      max={100}
      value={local}
      disabled={muted}
      onChange={(e) => setLocal(Number(e.target.value))}
      onPointerDown={() => { pointerDown.current = true; }}
      onPointerUp={() => { pointerDown.current = false; onChange(local); }}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer
        bg-zinc-700 accent-zinc-200
        disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

// ── Output device card ────────────────────────────────────────────────────

function DeviceCard({
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
      onClick={() => !device.isDefault && !switching && onSwitch(device.id)}
      disabled={device.isDefault || switching}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
        device.isDefault
          ? 'bg-zinc-700/60 cursor-default'
          : 'hover:bg-zinc-800 cursor-pointer',
      ].join(' ')}
    >
      {/* Active indicator */}
      <span className={[
        'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
        device.isDefault ? 'bg-emerald-400' : 'bg-zinc-600',
      ].join(' ')} />

      <DeviceTypeIcon name={device.name} />

      <span className={[
        'text-xs truncate flex-1',
        device.isDefault ? 'text-zinc-100 font-medium' : 'text-zinc-400',
      ].join(' ')}>
        {device.name}
      </span>

      {device.isDefault && (
        <span className="text-[10px] text-emerald-400 shrink-0">Active</span>
      )}
    </button>
  );
}

// ── Per-app session row ───────────────────────────────────────────────────

function SessionRow({
  session,
  onCommit,
}: {
  session: AudioSession;
  onCommit: (pid: number, vol: number) => void;
}) {
  const [local, setLocal] = useState(session.volumePercent);
  const pointerDown = useRef(false);

  useEffect(() => {
    if (!pointerDown.current) setLocal(session.volumePercent);
  }, [session.volumePercent]);

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-zinc-400 text-[11px] truncate w-24 shrink-0">{session.name}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerDown={() => { pointerDown.current = true; }}
        onPointerUp={() => { pointerDown.current = false; onCommit(session.pid, local); }}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-zinc-400"
      />
      <span className="text-zinc-500 text-[10px] tabular-nums font-mono w-6 text-right shrink-0">
        {local}
      </span>
    </div>
  );
}

// ── Widget root ───────────────────────────────────────────────────────────

export function SoundWidget() {
  const { data, isLoading, isError } = useSound();
  const setVolume = useSetVolume();
  const setMute = useSetMute();
  const switchDevice = useSwitchDevice();
  const setSessionVolume = useSetSessionVolume();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full flex items-center justify-center text-red-400/70 text-xs text-center px-4">
        Sound unavailable — check server logs
      </div>
    );
  }

  const { volumePercent: vol, muted, devices, sessions } = data;

  return (
    <div className="h-full flex flex-col gap-4 p-3 overflow-y-auto scrollbar-none">

      {/* ── Master volume ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMute.mutate(!muted)}
            className={[
              'flex items-center gap-1.5 text-xs font-medium transition-colors select-none',
              muted ? 'text-red-400 hover:text-red-300' : 'text-zinc-300 hover:text-white',
            ].join(' ')}
            title={muted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon vol={vol} muted={muted} />
            Volume
          </button>
          <span className="text-[11px] tabular-nums text-zinc-500 font-mono">
            {muted ? 'muted' : `${vol}%`}
          </span>
        </div>
        <MasterSlider
          value={vol}
          muted={muted}
          onChange={(v) => setVolume.mutate(v)}
        />
      </div>

      {/* ── Output devices ────────────────────────────────────────────────── */}
      {devices.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 px-0.5 mb-0.5">
            Output
          </p>
          {devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              onSwitch={(id) => switchDevice.mutate(id)}
              switching={switchDevice.isPending}
            />
          ))}
          {devices.length === 1 && (
            <p className="text-[10px] text-zinc-700 px-3 pt-0.5">
              Install AudioDeviceCmdlets to switch devices
            </p>
          )}
        </div>
      )}

      {/* ── App mixer ─────────────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 px-0.5">
            App mixer
          </p>
          {sessions.map((s) => (
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
