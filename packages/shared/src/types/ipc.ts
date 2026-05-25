export type IpcChannels =
  | 'app:minimize'
  | 'app:close'
  | 'spotify:open-auth'
  | 'spotify:token-store';

export interface ElectronAPI {
  minimize: () => void;
  close: () => void;
  openSpotifyAuth: (url: string) => void;
  onSpotifyTokenStored: (cb: () => void) => () => void;
}
