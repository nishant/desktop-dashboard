import type { FastifyPluginAsync } from 'fastify';
import type { SoundData, AudioDevice } from '@dash/shared';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SimpleCache } from '../cache/SimpleCache';

const execAsync = promisify(exec);
const cache = new SimpleCache<SoundData>();
const TTL_MS = 5_000;

async function sh(cmd: string): Promise<string> {
  const { stdout } = await execAsync(cmd, { encoding: 'utf8' });
  return stdout.trim();
}

// Runs a PowerShell script via -EncodedCommand to avoid shell-escaping issues
async function psRun(script: string): Promise<string> {
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  const { stdout } = await execAsync(
    `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
    { encoding: 'utf8' },
  );
  return stdout.trim();
}

// ── macOS ────────────────────────────────────────────────────────────────

async function macGetData(): Promise<SoundData> {
  const [volStr, mutedStr] = await Promise.all([
    sh(`osascript -e 'output volume of (get volume settings)'`),
    sh(`osascript -e 'output muted of (get volume settings)'`),
  ]);
  const volumePercent = Number(volStr);
  const muted = mutedStr === 'true';

  let activeDeviceName = 'Default Output';
  let devices: AudioDevice[] = [{ id: 'default', name: 'Default Output', isDefault: true }];

  try {
    const [current, all] = await Promise.all([
      sh('SwitchAudioSource -c'),
      sh('SwitchAudioSource -a -t output'),
    ]);
    activeDeviceName = current;
    devices = all
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ id: name, name, isDefault: name === current }));
  } catch {
    // SwitchAudioSource not installed — brew install switchaudio-osx
  }

  return { volumePercent, muted, activeDeviceName, devices };
}

async function macSetVolume(vol: number): Promise<void> {
  await sh(`osascript -e 'set volume output volume ${Math.round(vol)}'`);
}

async function macSetMute(muted: boolean): Promise<void> {
  await sh(`osascript -e 'set volume ${muted ? 'with' : 'without'} output muted'`);
}

async function macSwitchDevice(id: string): Promise<void> {
  await sh(`SwitchAudioSource -s "${id.replace(/"/g, '\\"')}"`);
}

// ── Windows ──────────────────────────────────────────────────────────────

// Inline C# for WASAPI — used when AudioDeviceCmdlets module is not installed.
// Add-Type compiles once per PS session; spawning a fresh process each call means
// ~500ms overhead, which is acceptable for a 5s poll fallback.
const WASAPI_TYPES = `
Add-Type -ErrorAction Stop -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {
    int RegisterControlChangeNotify(IntPtr n);
    int UnregisterControlChangeNotify(IntPtr n);
    int GetChannelCount(out uint c);
    int SetMasterVolumeLevel(float l, ref Guid g);
    int SetMasterVolumeLevelScalar(float l, ref Guid g);
    int GetMasterVolumeLevel(out float l);
    int GetMasterVolumeLevelScalar(out float l);
    int SetChannelVolumeLevel(uint n, float l, ref Guid g);
    int SetChannelVolumeLevelScalar(uint n, float l, ref Guid g);
    int GetChannelVolumeLevel(uint n, out float l);
    int GetChannelVolumeLevelScalar(uint n, out float l);
    int SetMute(bool m, ref Guid g);
    int GetMute(out bool m);
    int GetVolumeStepInfo(out uint s, out uint c);
    int VolumeStepUp(ref Guid g);
    int VolumeStepDown(ref Guid g);
    int QueryHardwareSupport(out uint m);
    int GetVolumeRange(out float mn, out float mx, out float inc);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
    int Activate(ref Guid iid, uint ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object ppv);
    int OpenPropertyStore(uint a, out IntPtr pp);
    int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
    int GetState(out uint s);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
    int EnumAudioEndpoints(int f, uint s, out IntPtr pp);
    int GetDefaultAudioEndpoint(int f, int r, out IMMDevice pp);
    int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string id, out IMMDevice pp);
    int RegisterEndpointNotificationCallback(IntPtr p);
    int UnregisterEndpointNotificationCallback(IntPtr p);
}
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E"), ComImport]
public class MMDeviceEnumerator {}
'@
function Get-AEV {
    $e = [MMDeviceEnumerator]::new() -as [IMMDeviceEnumerator]
    $d = $null; $e.GetDefaultAudioEndpoint(0, 1, [ref]$d)
    $g = [Guid]"5CDF2C82-841E-4546-9722-0CF74078229A"
    $o = $null; $d.Activate([ref]$g, 23, [IntPtr]::Zero, [ref]$o)
    return $o -as [IAudioEndpointVolume]
}
`;

async function winGetData(): Promise<SoundData> {
  // Prefer AudioDeviceCmdlets: Install-Module -Name AudioDeviceCmdlets
  try {
    const out = await psRun(`
      $vol  = Get-AudioDevice -PlaybackVolume
      $mute = Get-AudioDevice -PlaybackMute
      $def  = (Get-AudioDevice -Playback).Name
      $list = (Get-AudioDevice -List | Where-Object { $_.Type -eq 'Playback' } | ForEach-Object { $_.Name }) -join ','
      "$vol|$mute|$def|$list"
    `);
    const [volStr, muteStr, defName, listStr] = out.split('|');
    const volumePercent = Math.round(Number(volStr));
    const muted = muteStr.trim() === 'True';
    const activeDeviceName = defName.trim();
    const names = listStr ? listStr.split(',').map((s) => s.trim()).filter(Boolean) : [activeDeviceName];
    const devices: AudioDevice[] = names.map((name) => ({
      id: name,
      name,
      isDefault: name === activeDeviceName,
    }));
    return { volumePercent, muted, activeDeviceName, devices };
  } catch {
    // Fallback: WASAPI inline C#
    const out = await psRun(`
      ${WASAPI_TYPES}
      $v = Get-AEV
      $l = 0.0; $v.GetMasterVolumeLevelScalar([ref]$l)
      $m = $false; $v.GetMute([ref]$m)
      "$([Math]::Round($l * 100))|$m"
    `);
    const [volStr, muteStr] = out.split('|');
    return {
      volumePercent: Number(volStr),
      muted: muteStr.trim() === 'True',
      activeDeviceName: 'Default Device',
      devices: [{ id: 'default', name: 'Default Device', isDefault: true }],
    };
  }
}

async function winSetVolume(vol: number): Promise<void> {
  try {
    await psRun(`Set-AudioDevice -PlaybackVolume ${Math.round(vol)}`);
  } catch {
    const scalar = (vol / 100).toFixed(4);
    await psRun(`
      ${WASAPI_TYPES}
      $v = Get-AEV; $g = [Guid]::Empty
      $v.SetMasterVolumeLevelScalar(${scalar}, [ref]$g)
    `);
  }
}

async function winSetMute(muted: boolean): Promise<void> {
  try {
    await psRun(`Set-AudioDevice -PlaybackMute ${muted ? '$true' : '$false'}`);
  } catch {
    await psRun(`
      ${WASAPI_TYPES}
      $v = Get-AEV; $g = [Guid]::Empty
      $v.SetMute(${muted ? '$true' : '$false'}, [ref]$g)
    `);
  }
}

async function winSwitchDevice(id: string): Promise<void> {
  const safe = id.replace(/'/g, "''");
  await psRun(
    `Get-AudioDevice -List | Where-Object { $_.Name -eq '${safe}' -and $_.Type -eq 'Playback' } | Set-AudioDevice`,
  );
}

// ── Dispatch ─────────────────────────────────────────────────────────────

async function getData(): Promise<SoundData> {
  switch (process.platform) {
    case 'darwin': return macGetData();
    case 'win32':  return winGetData();
    default: throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

async function setVolume(vol: number): Promise<void> {
  switch (process.platform) {
    case 'darwin': return macSetVolume(vol);
    case 'win32':  return winSetVolume(vol);
  }
}

async function setMute(muted: boolean): Promise<void> {
  switch (process.platform) {
    case 'darwin': return macSetMute(muted);
    case 'win32':  return winSetMute(muted);
  }
}

async function switchDevice(id: string): Promise<void> {
  switch (process.platform) {
    case 'darwin': return macSwitchDevice(id);
    case 'win32':  return winSwitchDevice(id);
  }
}

// ── Routes ───────────────────────────────────────────────────────────────

export const soundRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: SoundData | { error: string } }>('/', async (_req, reply) => {
    const cached = cache.get();
    if (cached) return reply.send(cached);
    try {
      const data = await getData();
      cache.set(data, TTL_MS);
      return reply.send(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fastify.log.error(`[sound] ${msg}`);
      return reply.code(502).send({ error: msg });
    }
  });

  fastify.post<{ Body: { volumePercent: number }; Reply: { ok: boolean } | { error: string } }>(
    '/volume',
    async (req, reply) => {
      const { volumePercent } = req.body;
      if (typeof volumePercent !== 'number' || volumePercent < 0 || volumePercent > 100) {
        return reply.code(400).send({ error: 'volumePercent must be 0–100' });
      }
      try {
        await setVolume(volumePercent);
        cache.clear();
        return reply.send({ ok: true });
      } catch (err) {
        return reply.code(502).send({ error: err instanceof Error ? err.message : String(err) });
      }
    },
  );

  fastify.post<{ Body: { muted: boolean }; Reply: { ok: boolean } | { error: string } }>(
    '/mute',
    async (req, reply) => {
      try {
        await setMute(req.body.muted);
        cache.clear();
        return reply.send({ ok: true });
      } catch (err) {
        return reply.code(502).send({ error: err instanceof Error ? err.message : String(err) });
      }
    },
  );

  fastify.post<{ Body: { deviceId: string }; Reply: { ok: boolean } | { error: string } }>(
    '/device',
    async (req, reply) => {
      try {
        await switchDevice(req.body.deviceId);
        cache.clear();
        return reply.send({ ok: true });
      } catch (err) {
        return reply.code(502).send({ error: err instanceof Error ? err.message : String(err) });
      }
    },
  );
};
