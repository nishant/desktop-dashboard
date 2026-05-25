import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type {
  TrackData, SpotifyAuthStatus,
  SpotifyPlaylistsPage, SpotifyTracksPage, SpotifyDevice,
} from '@dash/shared';

export function useSpotifyStatus() {
  return useQuery<SpotifyAuthStatus>({
    queryKey: ['spotify-status'],
    queryFn: () => apiClient.get<SpotifyAuthStatus>('/api/spotify/auth-status'),
    refetchInterval: 5000,
    staleTime: 4000,
  });
}

export function useNowPlaying() {
  return useQuery<TrackData>({
    queryKey: ['spotify-now-playing'],
    queryFn: () => apiClient.get<TrackData>('/api/spotify/now-playing'),
    refetchInterval: 3000,
    staleTime: 2500,
  });
}

export function useSpotifyAuthUrl() {
  return useQuery<{ url: string }>({
    queryKey: ['spotify-auth-url'],
    queryFn: () => apiClient.get<{ url: string }>('/api/spotify/auth-url'),
    enabled: false,
    staleTime: 0,
  });
}

// 20 playlists per page — fast initial load, scroll for more
export function usePlaylistsInfinite(enabled: boolean) {
  return useInfiniteQuery<SpotifyPlaylistsPage>({
    queryKey: ['spotify-playlists'],
    queryFn: ({ pageParam }) =>
      apiClient.get<SpotifyPlaylistsPage>(`/api/spotify/playlists?offset=${pageParam as number}&limit=20`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
    enabled,
    staleTime: 25_000,
    refetchOnWindowFocus: false,
  });
}

// 100 tracks per page as requested
export function usePlaylistTracksInfinite(playlistId: string | null) {
  return useInfiniteQuery<SpotifyTracksPage>({
    queryKey: ['spotify-playlist-tracks', playlistId],
    queryFn: ({ pageParam }) =>
      apiClient.get<SpotifyTracksPage>(
        `/api/spotify/playlist-tracks?playlistId=${playlistId}&offset=${pageParam as number}&limit=100`,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
    enabled: playlistId !== null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useDevices(enabled: boolean) {
  return useQuery<SpotifyDevice[]>({
    queryKey: ['spotify-devices'],
    queryFn: () => apiClient.get<SpotifyDevice[]>('/api/spotify/devices'),
    enabled,
    refetchInterval: 8_000,
    staleTime: 5_000,
  });
}

// ── Playback mutations ────────────────────────────────────────────────────────

export function usePlay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/api/spotify/play'),
    onMutate: () => {
      qc.setQueryData<TrackData>(['spotify-now-playing'], (old) =>
        old ? { ...old, isPlaying: true } : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function usePause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/api/spotify/pause'),
    onMutate: () => {
      qc.setQueryData<TrackData>(['spotify-now-playing'], (old) =>
        old ? { ...old, isPlaying: false } : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function useNext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/api/spotify/next'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function usePrevious() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/api/spotify/previous'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function useSeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (positionMs: number) => apiClient.post('/api/spotify/seek', { positionMs }),
    onMutate: (positionMs) => {
      qc.setQueryData<TrackData>(['spotify-now-playing'], (old) =>
        old ? { ...old, progressMs: positionMs } : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function useSpotifyVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (volumePercent: number) =>
      apiClient.post('/api/spotify/volume', { volumePercent }),
    onMutate: (volumePercent) => {
      qc.setQueryData<TrackData>(['spotify-now-playing'], (old) =>
        old ? { ...old, volumePercent } : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function useShuffle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (state: boolean) => apiClient.post('/api/spotify/shuffle', { state }),
    onMutate: (state) => {
      qc.setQueryData<TrackData>(['spotify-now-playing'], (old) =>
        old ? { ...old, shuffleState: state } : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function useRepeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (state: 'off' | 'track' | 'context') =>
      apiClient.post('/api/spotify/repeat', { state }),
    onMutate: (state) => {
      qc.setQueryData<TrackData>(['spotify-now-playing'], (old) =>
        old ? { ...old, repeatState: state } : old,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['spotify-now-playing'] }),
  });
}

export function usePlayContext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { contextUri: string; deviceId?: string; shuffle?: boolean }) =>
      apiClient.post('/api/spotify/play-context', args),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['spotify-now-playing'] });
      void qc.invalidateQueries({ queryKey: ['spotify-devices'] });
    },
  });
}

export function usePlayTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { trackUri: string; contextUri?: string; deviceId?: string }) =>
      apiClient.post('/api/spotify/play-track', args),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['spotify-now-playing'] });
    },
  });
}
