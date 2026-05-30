import { ChildProcess, spawn } from 'child_process';
import { app } from 'electron';
import path from 'path';
import { readCredentials } from '../credentials';

let serverProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';
const port = Number(process.env.SERVER_PORT ?? 7432);

async function waitForServer(timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server on :${port} did not start within ${timeoutMs}ms`);
}

export async function spawnServer(): Promise<void> {
  if (!isDev) {
    // In production the server lives at {appPath}/server/index.js
    // (electron-builder maps packages/server/dist → server/ with asar: false)
    const serverEntry = path.join(app.getAppPath(), 'server', 'index.js');

    // Inject credentials stored via safeStorage so the server reads them from process.env
    const credentials = readCredentials();

    serverProcess = spawn(process.execPath, [serverEntry], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SERVER_PORT: String(port),
        ...credentials,
      },
      stdio: 'pipe',
    });
    serverProcess.stdout?.pipe(process.stdout);
    serverProcess.stderr?.pipe(process.stderr);
    serverProcess.on('error', (err) => console.error('[server] spawn error:', err));
  }
  // In dev, concurrently already started the server — just wait for it.

  await waitForServer();
  console.log(`[server] ready on :${port}`);
}

export function stopServer(): void {
  serverProcess?.kill();
  serverProcess = null;
}

/** Save new credentials and restart the server child process with updated env vars.
 *  No-op in dev (server is managed externally by concurrently). */
export async function restartServer(): Promise<void> {
  if (isDev) return;
  stopServer();
  await spawnServer();
}
