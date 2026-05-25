import { useState } from 'react';
import { Volume2, VolumeX, Volume1, Volume } from 'lucide-react';
import { useSound, useSetVolume, useSetMute, useSwitchDevice } from './useSound';
import type { AudioDevice } from '@dash/shared';

function VolumeIcon({ vol, muted }: { vol: number; muted: boolean }) {
  if (muted || vol === 0) return <VolumeX size={16} className="shrink-0" />;
  if (vol < 33) return <Volume size={16} className="shrink-0" />;
  if (vol < 66) return <Volume1 size={16} className="shrink-0" />;
  return <Volume2 size={16} className="shrink-0" />;
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
        'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
        device.isDefault
          ? 'bg-zinc-700/60 text-white cursor-default'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block w-1.5 h-1.5 rounded-full mr-2 mb-px',
          device.isDefault ? 'bg-emerald-400' : 'bg-zinc-600',
        ].join(' ')}
      />
      {device.name}
    </button>
  );
}

export function SoundWidget() {
  const { data, isLoading, isError } = useSound();
  const setVolume = useSetVolume();
  const setMute = useSetMute();
  const switchDevice = useSwitchDevice();

  // Local slider value while dragging — prevents jitter from 5s poll
  const [dragging, setDragging] = useState<number | null>(null);
  const displayVol = dragging ?? data?.volumePercent ?? 0;
  const muted = data?.muted ?? false;

  function onSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDragging(Number(e.target.value));
  }

  function onSliderCommit() {
    if (dragging !== null) {
      setVolume.mutate(dragging);
      setDragging(null);
    }
  }

  function toggleMute() {
    setMute.mutate(!muted);
  }

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
    <div className="h-full flex flex-col gap-3 p-3 overflow-hidden">
      {/* Volume row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleMute}
            className={[
              'flex items-center gap-2 transition-colors',
              muted ? 'text-red-400 hover:text-red-300' : 'text-zinc-300 hover:text-white',
            ].join(' ')}
            title={muted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon vol={displayVol} muted={muted} />
            <span className="text-xs font-medium">Volume</span>
          </button>
          <span className="text-xs tabular-nums text-zinc-400 font-mono">
            {muted ? 'muted' : `${displayVol}%`}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={displayVol}
          disabled={muted}
          onChange={onSliderChange}
          onPointerUp={onSliderCommit}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            bg-zinc-700 accent-zinc-300
            disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      {/* Devices */}
      {data.devices.length > 0 && (
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0">
          <span className="text-[10px] uppercase tracking-wider text-zinc-600 px-1">
            Output
          </span>
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
    </div>
  );
}
