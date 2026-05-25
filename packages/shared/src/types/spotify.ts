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

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  uri: string;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string; // 'Computer' | 'Smartphone' | 'Speaker' | ...
  isActive: boolean;
  volumePercent: number | null;
}
