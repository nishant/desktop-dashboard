import { ChildProcess, spawn } from 'child_process';
import path from 'path';

let serverProcess: ChildProcess | null = null;

async function waitForServer(port: number, timeoutMs = 15000): Promise<void> {
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
  const isDev = process.env.NODE_ENV === 'development';
  const port = Number(process.env.SERVER_PORT ?? 7432);

  if (!isDev) {
    // In production, spawn the compiled server alongside the app.
    // TODO: adjust path after electron-builder packaging is configured.
    const serverEntry = path.resolve(__dirname, '../../../server/dist/index.js');
    serverProcess = spawn(process.execPath, [serverEntry], {
      env: { ...process.env },
      stdio: 'pipe',
    });
    serverProcess.stdout?.pipe(process.stdout);
    serverProcess.stderr?.pipe(process.stderr);
    serverProcess.on('error', (err) => console.error('[server] spawn error:', err));
  }
  // In dev, concurrently already started the server — just wait for it.

  await waitForServer(port);
  console.log(`[server] ready on :${port}`);
}

export function stopServer(): void {
  serverProcess?.kill();
  serverProcess = null;
}
