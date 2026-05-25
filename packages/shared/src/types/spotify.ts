export interface TrackData {
  isPlaying: boolean;
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string;
  durationMs: number;
  progressMs: number;
  shuffleState: boolean;
  repeatState: 'off' | 'track' | 'context';
  volumePercent: number;
}

export interface SpotifyAuthStatus {
  authenticated: boolean;
}
