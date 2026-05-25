import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
  Music,
} from 'lucide-react';
import {
  useSpotifyStatus,
  useNowPlaying,
  useSpotifyAuthUrl,
  usePlay,
  usePause,
  useNext,
  usePrevious,
  useSeek,
  useSpotifyVolume,
  useShuffle,
  useRepeat,
} from './useSpotify';
import type { TrackData } from '@dash/shared';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ConnectView({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-14 h-14 rounded-full bg-[#1DB954]/10 flex items-center justify-center">
        <Music size={24} className="text-[#1DB954]" />
      </div>
      <div className="text-center">
        <p className="text-zinc-200 font-medium text-sm">Spotify</p>
        <p className="text-zinc-500 text-xs mt-1">Connect your account to see what's playing</p>
      </div>
      <button
        onClick={onConnect}
        className="px-4 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-colors"
      >
        Connect Spotify
      </button>
    </div>
  );
}

function NotPlayingView() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 p-6">
      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
        <Music size={20} className="text-zinc-600" />
      </div>
      <p className="text-zinc-500 text-xs">Nothing playing</p>
    </div>
  );
}

function ProgressBar({
  progressMs,
  durationMs,
  onSeek,
}: {
  progressMs: number;
  durationMs: number;
  onSeek: (ms: number) => void;
}) {
  const [localMs, setLocalMs] = useState(progressMs);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setLocalMs(progressMs);
  }, [progressMs]);

  const pct = durationMs > 0 ? (localMs / durationMs) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 text-[10px] w-7 text-right">{fmtMs(localMs)}</span>
      <div className="flex-1 relative h-1 group">
        <input
          type="range"
          min={0}
          max={durationMs}
          value={localMs}
          onChange={(e) => { dragging.current = true; setLocalMs(Number(e.target.value)); }}
          onPointerUp={(e) => {
            dragging.current = false;
            onSeek(Number((e.target as HTMLInputElement).value));
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="w-full h-full rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-zinc-200 group-hover:bg-[#1DB954] transition-colors"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-zinc-500 text-[10px] w-7">{fmtMs(durationMs)}</span>
    </div>
  );
}

function VolumeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(value);
  const pointerDown = useRef(false);

  useEffect(() => {
    if (!pointerDown.current) setLocal(value);
  }, [value]);

  return (
    <div className="flex items-center gap-1.5">
      {local === 0
        ? <VolumeX size={12} className="text-zinc-500 shrink-0" />
        : <Volume2 size={12} className="text-zinc-500 shrink-0" />}
      <input
        type="range"
        min={0}
        max={100}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerDown={() => { pointerDown.current = true; }}
        onPointerUp={() => {
          pointerDown.current = false;
          onChange(local);
        }}
        className="w-16 h-1 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-zinc-300"
      />
    </div>
  );
}

function RepeatIcon({ state }: { state: TrackData['repeatState'] }) {
  if (state === 'track') return <Repeat1 size={14} />;
  return <Repeat size={14} />;
}

function nextRepeatState(current: TrackData['repeatState']): TrackData['repeatState'] {
  if (current === 'off') return 'context';
  if (current === 'context') return 'track';
  return 'off';
}

function NowPlayingView({ data }: { data: TrackData }) {
  const play = usePlay();
  const pause = usePause();
  const next = useNext();
  const previous = usePrevious();
  const seek = useSeek();
  const volume = useSpotifyVolume();
  const shuffle = useShuffle();
  const repeat = useRepeat();

  const handlePlayPause = useCallback(() => {
    if (data.isPlaying) {
      pause.mutate();
    } else {
      play.mutate();
    }
  }, [data.isPlaying, play, pause]);

  const handleRepeat = useCallback(() => {
    repeat.mutate(nextRepeatState(data.repeatState));
  }, [data.repeatState, repeat]);

  const activeClass = (flag: boolean) =>
    flag ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-zinc-300';

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
      {/* Album art + track info */}
      <div className="flex gap-3 items-center min-w-0">
        {data.albumArtUrl ? (
          <img
            src={data.albumArtUrl}
            alt={data.albumName}
            className="w-14 h-14 rounded-md object-cover shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-md bg-zinc-800 shrink-0 flex items-center justify-center">
            <Music size={20} className="text-zinc-600" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-zinc-100 text-sm font-medium truncate leading-tight">
            {data.trackName || '—'}
          </p>
          <p className="text-zinc-400 text-xs truncate mt-0.5">{data.artistName}</p>
          <p className="text-zinc-600 text-xs truncate">{data.albumName}</p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        progressMs={data.progressMs}
        durationMs={data.durationMs}
        onSeek={(ms) => seek.mutate(ms)}
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => shuffle.mutate(!data.shuffleState)}
          className={`transition-colors ${activeClass(data.shuffleState)}`}
          title="Shuffle"
        >
          <Shuffle size={14} />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => previous.mutate()}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Previous"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-white text-zinc-900 flex items-center justify-center transition-colors"
            title={data.isPlaying ? 'Pause' : 'Play'}
          >
            {data.isPlaying
              ? <Pause size={16} fill="currentColor" />
              : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>

          <button
            onClick={() => next.mutate()}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Next"
          >
            <SkipForward size={18} />
          </button>
        </div>

        <button
          onClick={handleRepeat}
          className={`transition-colors ${activeClass(data.repeatState !== 'off')}`}
          title={`Repeat: ${data.repeatState}`}
        >
          <RepeatIcon state={data.repeatState} />
        </button>
      </div>

      {/* Volume */}
      <div className="flex justify-end">
        <VolumeSlider
          value={data.volumePercent}
          onChange={(v) => volume.mutate(v)}
        />
      </div>
    </div>
  );
}

// ── Widget root ───────────────────────────────────────────────────────────────

export function SpotifyWidget() {
  const status = useSpotifyStatus();
  const nowPlaying = useNowPlaying();
  const authUrlQuery = useSpotifyAuthUrl();

  const handleConnect = useCallback(async () => {
    const result = await authUrlQuery.refetch();
    if (result.data?.url) {
      window.electron.openSpotifyAuth(result.data.url);
    }
  }, [authUrlQuery]);

  if (status.isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 h-full flex items-center justify-center">
        <span className="text-zinc-600 text-xs">Connecting…</span>
      </div>
    );
  }

  if (!status.data?.authenticated) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 h-full">
        <ConnectView onConnect={handleConnect} />
      </div>
    );
  }

  const track = nowPlaying.data;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 h-full">
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
        <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
        <span className="text-zinc-400 text-xs font-medium tracking-wide uppercase">Spotify</span>
      </div>

      {!track || (!track.isPlaying && !track.trackId) ? (
        <NotPlayingView />
      ) : (
        <NowPlayingView data={track} />
      )}
    </div>
  );
}
