export interface TrackData {
  isPlaying: boolean;
  trackId: string;
  trackName: string;
  artistName: string;   // episodes: show name
  albumName: string;    // episodes: '' (unused)
  albumArtUrl: string;
  durationMs: number;
  progressMs: number;
  shuffleState: boolean;
  repeatState: 'off' | 'track' | 'context';
  volumePercent: number;
  type: 'track' | 'episode';
}

export interface SpotifyAuthStatus {
  authenticated: boolean;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;  // -1 if unknown (Liked Songs when fetch fails)
  uri: string;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent: number | null;
}

export interface SpotifyTrackItem {
  trackId: string;
  trackName: string;
  artistName: string;   // episodes: show name
  durationMs: number;
  uri: string;
  type: 'track' | 'episode';
  imageUrl: string | null;
  isLocal: boolean;
}

export interface SpotifyPlaylistsPage {
  items: SpotifyPlaylist[];
  total: number;   // Spotify's total (not counting Liked Songs synthetic item)
  offset: number;
  limit: number;
}

export interface SpotifyTracksPage {
  items: SpotifyTrackItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface SpotifySearchResults {
  tracks: SpotifyTrackItem[];
  episodes: SpotifyTrackItem[];
}
