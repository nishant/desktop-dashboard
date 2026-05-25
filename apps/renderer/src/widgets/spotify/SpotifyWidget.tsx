import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
  Music, ListMusic, ArrowLeft, Monitor, Smartphone, Speaker,
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
  usePlaylists,
  useDevices,
  usePlayContext,
} from './useSpotify';
import type { TrackData, SpotifyPlaylist, SpotifyDevice } from '@dash/shared';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function DeviceIcon({ type }: { type: string }) {
  if (type === 'Smartphone') return <Smartphone size={11} className="shrink-0" />;
  if (type === 'Speaker') return <Speaker size={11} className="shrink-0" />;
  return <Monitor size={11} className="shrink-0" />;
}

// ── Progress bar with local 1s ticker ─────────────────────────────────────────

function ProgressBar({
  progressMs,
  durationMs,
  isPlaying,
  onSeek,
}: {
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (ms: number) => void;
}) {
  const [localMs, setLocalMs] = useState(progressMs);
  const dragging = useRef(false);

  // Sync from server poll when not dragging
  useEffect(() => {
    if (!dragging.current) setLocalMs(progressMs);
  }, [progressMs]);

  // Advance 1s per second while playing so the bar doesn't stutter between 3s polls
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (!dragging.current) {
        setLocalMs((prev) => Math.min(prev + 1000, durationMs));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, durationMs]);

  const pct = durationMs > 0 ? (localMs / durationMs) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 text-[10px] w-7 text-right tabular-nums">{fmtMs(localMs)}</span>
      <div className="flex-1 relative h-1 group cursor-pointer">
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
      <span className="text-zinc-500 text-[10px] w-7 tabular-nums">{fmtMs(durationMs)}</span>
    </div>
  );
}

// ── Volume slider ─────────────────────────────────────────────────────────────

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
        onPointerUp={() => { pointerDown.current = false; onChange(local); }}
        className="w-16 h-1 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-zinc-300"
      />
    </div>
  );
}

// ── Playlist panel ────────────────────────────────────────────────────────────

function PlaylistPanel({
  onBack,
  nowPlayingUri,
}: {
  onBack: () => void;
  nowPlayingUri?: string; // context_uri of currently playing context (if any)
}) {
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>(undefined);
  const playlists = usePlaylists(true);
  const devices = useDevices(true);
  const playContext = usePlayContext();

  const activeDevice = devices.data?.find((d) => d.isActive);
  // Auto-select active device
  useEffect(() => {
    if (activeDevice && !selectedDevice) setSelectedDevice(activeDevice.id);
  }, [activeDevice, selectedDevice]);

  const handlePlay = useCallback((playlist: SpotifyPlaylist) => {
    playContext.mutate({ contextUri: playlist.uri, deviceId: selectedDevice });
    onBack();
  }, [playContext, selectedDevice, onBack]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2 shrink-0">
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Back"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-zinc-400 text-xs font-medium">Your Playlists</span>
      </div>

      {/* Device selector */}
      {devices.data && devices.data.length > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-1 flex-wrap">
            {devices.data.map((dev) => (
              <button
                key={dev.id}
                onClick={() => setSelectedDevice(dev.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                  selectedDevice === dev.id
                    ? 'bg-[#1DB954]/15 border-[#1DB954]/40 text-[#1DB954]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
                title={dev.name}
              >
                <DeviceIcon type={dev.type} />
                <span className="max-w-[80px] truncate">{dev.name}</span>
                {dev.isActive && <span className="w-1 h-1 rounded-full bg-[#1DB954] shrink-0" />}
              </button>
            ))}
          </div>
          {!activeDevice && !selectedDevice && (
            <p className="text-amber-500/80 text-[10px] mt-1">
              No active device — select one above or open Spotify first
            </p>
          )}
        </div>
      )}

      {devices.data?.length === 0 && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-amber-500/80 text-[10px]">
            Open Spotify on a device to enable playback
          </p>
        </div>
      )}

      {/* Playlist list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
        {playlists.isLoading && (
          <p className="text-zinc-600 text-xs text-center py-4">Loading playlists…</p>
        )}
        {playlists.isError && (
          <p className="text-red-400/70 text-xs text-center py-4">
            Failed to load — re-authorize if scopes changed
          </p>
        )}
        {playlists.data?.map((pl) => (
          <button
            key={pl.id}
            onClick={() => handlePlay(pl)}
            disabled={playContext.isPending}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors group
              ${playContext.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800'}
              ${pl.uri === nowPlayingUri ? 'bg-zinc-800/60' : ''}
            `}
          >
            {pl.imageUrl ? (
              <img
                src={pl.imageUrl}
                alt={pl.name}
                className="w-8 h-8 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-zinc-800 shrink-0 flex items-center justify-center">
                <Music size={12} className="text-zinc-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-xs truncate font-medium leading-tight ${
                pl.uri === nowPlayingUri ? 'text-[#1DB954]' : 'text-zinc-200 group-hover:text-zinc-100'
              }`}>
                {pl.name}
              </p>
              <p className="text-[10px] text-zinc-500">{pl.trackCount} tracks</p>
            </div>
            <Play
              size={12}
              className="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Now playing view ──────────────────────────────────────────────────────────

function RepeatIcon({ state }: { state: TrackData['repeatState'] }) {
  if (state === 'track') return <Repeat1 size={14} />;
  return <Repeat size={14} />;
}

function nextRepeatState(current: TrackData['repeatState']): TrackData['repeatState'] {
  if (current === 'off') return 'context';
  if (current === 'context') return 'track';
  return 'off';
}

function NowPlayingView({
  data,
  onOpenPlaylists,
}: {
  data: TrackData;
  onOpenPlaylists: () => void;
}) {
  const play = usePlay();
  const pause = usePause();
  const next = useNext();
  const previous = usePrevious();
  const seek = useSeek();
  const volume = useSpotifyVolume();
  const shuffle = useShuffle();
  const repeat = useRepeat();

  const handlePlayPause = useCallback(() => {
    if (data.isPlaying) pause.mutate(); else play.mutate();
  }, [data.isPlaying, play, pause]);

  const handleRepeat = useCallback(() => {
    repeat.mutate(nextRepeatState(data.repeatState));
  }, [data.repeatState, repeat]);

  const activeClass = (flag: boolean) =>
    flag ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-zinc-300';

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
      {/* Album art + track info + playlist button */}
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
        <div className="min-w-0 flex-1">
          <p className="text-zinc-100 text-sm font-medium truncate leading-tight">
            {data.trackName || '—'}
          </p>
          <p className="text-zinc-400 text-xs truncate mt-0.5">{data.artistName}</p>
          <p className="text-zinc-600 text-xs truncate">{data.albumName}</p>
        </div>
        <button
          onClick={onOpenPlaylists}
          className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 self-start mt-0.5"
          title="Browse playlists"
        >
          <ListMusic size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar
        progressMs={data.progressMs}
        durationMs={data.durationMs}
        isPlaying={data.isPlaying}
        onSeek={(ms) => seek.mutate(ms)}
      />

      {/* Playback controls */}
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
        <VolumeSlider value={data.volumePercent} onChange={(v) => volume.mutate(v)} />
      </div>
    </div>
  );
}

// ── Nothing playing view ──────────────────────────────────────────────────────

function NotPlayingView({ onOpenPlaylists }: { onOpenPlaylists: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
        <Music size={20} className="text-zinc-600" />
      </div>
      <p className="text-zinc-500 text-xs">Nothing playing</p>
      <button
        onClick={onOpenPlaylists}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
      >
        <ListMusic size={12} />
        Browse playlists
      </button>
    </div>
  );
}

// ── Connect view ──────────────────────────────────────────────────────────────

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

// ── Widget root ───────────────────────────────────────────────────────────────

export function SpotifyWidget() {
  const status = useSpotifyStatus();
  const nowPlaying = useNowPlaying();
  const authUrlQuery = useSpotifyAuthUrl();
  const [showPlaylists, setShowPlaylists] = useState(false);

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
  const hasTrack = Boolean(track?.trackId);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 h-full flex flex-col overflow-hidden">
      {/* Header — always visible */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
        <span className="text-zinc-400 text-xs font-medium tracking-wide uppercase">Spotify</span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {showPlaylists ? (
          <PlaylistPanel
            onBack={() => setShowPlaylists(false)}
            nowPlayingUri={undefined} // TODO: surface context_uri from /me/player when available
          />
        ) : hasTrack ? (
          <NowPlayingView
            data={track!}
            onOpenPlaylists={() => setShowPlaylists(true)}
          />
        ) : (
          <NotPlayingView onOpenPlaylists={() => setShowPlaylists(true)} />
        )}
      </div>
    </div>
  );
}
