import { app, BrowserWindow, IpcMain, shell } from 'electron';
import { readCredentials, writeCredentials } from '../credentials';
import { restartServer } from '../server/spawn';
import type { CredentialKey } from '@dash/shared';

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

  // ── Credentials ─────────────────────────────────────────────────────────────

  ipcMain.handle('credentials:get-all', () => {
    return readCredentials();
  });

  ipcMain.handle('credentials:save-all', async (_event, creds: Partial<Record<CredentialKey, string>>) => {
    writeCredentials(creds);
    await restartServer();
  });
}
