import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { TrackData, SpotifyAuthStatus } from '@dash/shared';

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
    enabled: false, // only fetch on demand
    staleTime: 0,
  });
}

// ── Playback mutations ────────────────────────────────────────────────────────

function usePlaybackMutation(endpoint: string, body?: unknown) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(endpoint, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['spotify-now-playing'] });
    },
  });
}

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
  return usePlaybackMutation('/api/spotify/next');
}

export function usePrevious() {
  return usePlaybackMutation('/api/spotify/previous');
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
