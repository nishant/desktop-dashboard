import type { CredentialKey } from './credentials';

export type IpcChannels =
  | 'app:minimize'
  | 'app:close'
  | 'spotify:open-auth'
  | 'spotify:token-store'
  | 'credentials:get-all'
  | 'credentials:save-all';

export interface ElectronAPI {
  minimize: () => void;
  close: () => void;
  openSpotifyAuth: (url: string) => void;
  onSpotifyTokenStored: (cb: () => void) => () => void;
  credentials: {
    getAll: () => Promise<Partial<Record<CredentialKey, string>>>;
    saveAll: (creds: Partial<Record<CredentialKey, string>>) => Promise<void>;
  };
}
