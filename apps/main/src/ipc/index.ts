import { app, BrowserWindow, IpcMain } from 'electron';

export function registerIpcHandlers(ipcMain: IpcMain): void {
  ipcMain.on('app:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.on('app:close', () => {
    app.quit();
  });

  ipcMain.on('spotify:auth-start', (event) => {
    // OAuth PKCE flow implemented in feature/spotify-widget
    // Will open an auth window, exchange code, store token via safeStorage
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.webContents.send('spotify:token-store');
  });
}
