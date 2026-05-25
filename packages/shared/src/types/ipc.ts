export type IpcChannels =
  | 'app:minimize'
  | 'app:close'
  | 'spotify:auth-start'
  | 'spotify:token-store';

export interface ElectronAPI {
  minimize: () => void;
  close: () => void;
  startSpotifyAuth: () => void;
  onSpotifyTokenStored: (cb: () => void) => () => void;
}
