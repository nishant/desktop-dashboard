import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, IpcChannels } from '@dash/shared';

const electronAPI: ElectronAPI = {
  minimize: () => ipcRenderer.send('app:minimize' satisfies IpcChannels),
  close: () => ipcRenderer.send('app:close' satisfies IpcChannels),
  startSpotifyAuth: () => ipcRenderer.send('spotify:auth-start' satisfies IpcChannels),
  onSpotifyTokenStored: (cb: () => void) => {
    const channel: IpcChannels = 'spotify:token-store';
    ipcRenderer.on(channel, cb);
    return () => ipcRenderer.removeListener(channel, cb);
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
