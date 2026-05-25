import { app, BrowserWindow, IpcMain, shell } from 'electron';

export function registerIpcHandlers(ipcMain: IpcMain): void {
  ipcMain.on('app:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.on('app:close', () => {
    app.quit();
  });

  ipcMain.on('spotify:open-auth', (_event, url: string) => {
    shell.openExternal(url);
  });
}
