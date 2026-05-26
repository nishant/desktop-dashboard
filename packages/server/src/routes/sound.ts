import type { FastifyPluginAsync } from 'fastify';
import type { SoundData, AudioDevice, AudioSession } from '@dash/shared';
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

  return { volumePercent, muted, activeDeviceName, devices, sessions: [] };
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

// ── Windows — WASAPI COM types ────────────────────────────────────────────
//
// Single Add-Type block shared by all PS scripts to keep each invocation
// self-contained (each psRun spawns a fresh powershell.exe process).
// Interfaces must declare every vtable slot in SDK order, including inherited
// methods, because .NET COM interop lays them out flat.

// WASAPI COM block.
//
// CRITICAL: Every COM method call that returns int (HRESULT) MUST be suppressed
// with "$null = ..." — PowerShell emits any unassigned expression value to the
// pipeline (stdout).  Helper functions like Get-DefaultDevice that leak a "0"
// (S_OK) into the pipeline return @(0, $device) instead of just $device, which
// then breaks callers that try .Activate() on the array.
//
// Similarly all out-parameter variables MUST be explicitly typed ([float], [bool])
// because PowerShell's default [double] for 0.0 causes COM marshalling to read
// the wrong bytes when the interface declares "out float".

const WASAPI = `
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
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool m, ref Guid g);
    int GetMute([MarshalAs(UnmanagedType.Bool)] out bool m);
    int GetVolumeStepInfo(out uint s, out uint c);
    int VolumeStepUp(ref Guid g);
    int VolumeStepDown(ref Guid g);
    int QueryHardwareSupport(out uint m);
    int GetVolumeRange(out float mn, out float mx, out float inc);
}

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface ISimpleAudioVolume {
    int SetMasterVolume(float fLevel, ref Guid eventContext);
    int GetMasterVolume(out float pfLevel);
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid eventContext);
    int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
}

[Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionControl2 {
    int GetState(out int state);
    int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string name);
    int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid g);
    int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string path);
    int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid g);
    int GetGroupingParam(out Guid g);
    int SetGroupingParam(ref Guid g, ref Guid evt);
    int RegisterAudioSessionNotification(IntPtr client);
    int UnregisterAudioSessionNotification(IntPtr client);
    int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
    int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
    int GetProcessId(out uint pid);
    int IsSystemSoundsSession();
    int SetDuckingPreference([MarshalAs(UnmanagedType.Bool)] bool optOut);
}

[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionEnumerator {
    int GetCount(out int count);
    int GetSession(int index, out IAudioSessionControl2 session);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionManager2 {
    int GetAudioSessionControl(ref Guid sessionId, uint streamFlags, out IntPtr session);
    int GetSimpleAudioVolume(ref Guid sessionId, uint streamFlags, out IntPtr volume);
    int GetSessionEnumerator(out IAudioSessionEnumerator sessionEnum);
    int RegisterSessionNotification(IntPtr client);
    int UnregisterSessionNotification(IntPtr client);
    int RegisterDuckNotification([MarshalAs(UnmanagedType.LPWStr)] string sessionId, IntPtr client);
    int UnregisterDuckNotification(IntPtr client);
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

# $null = ... on every COM call — prevents HRESULT leaking into the pipeline
function Get-DefaultDevice {
    $e = [MMDeviceEnumerator]::new() -as [IMMDeviceEnumerator]
    $d = $null
    $null = $e.GetDefaultAudioEndpoint(0, 1, [ref]$d)
    return $d
}
function Get-AEV {
    $g = [Guid]"5CDF2C82-841E-4546-9722-0CF74078229A"
    $o = $null
    $null = (Get-DefaultDevice).Activate([ref]$g, 23, [IntPtr]::Zero, [ref]$o)
    return ($o -as [IAudioEndpointVolume])
}
function Get-SessionEnum {
    $g = [Guid]"77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"
    $o = $null
    $null = (Get-DefaultDevice).Activate([ref]$g, 23, [IntPtr]::Zero, [ref]$o)
    $mgr = $o -as [IAudioSessionManager2]
    $se = $null
    $null = $mgr.GetSessionEnumerator([ref]$se)
    return $se
}
`;

// ── Windows — device / master volume ─────────────────────────────────────

type WinDeviceData = Omit<SoundData, 'sessions'>;

async function winGetDeviceData(): Promise<WinDeviceData> {
  // Prefer AudioDeviceCmdlets (Install-Module AudioDeviceCmdlets)
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
    const devices: AudioDevice[] = names.map((name) => ({ id: name, name, isDefault: name === activeDeviceName }));
    return { volumePercent, muted, activeDeviceName, devices };
  } catch {
    // ── WASAPI fallback — volume + mute via COM ────────────────────────────
    // Use explicit [float]/[bool] types and $null= to suppress HRESULT output.
    const out = await psRun(`
      ${WASAPI}
      $v = Get-AEV
      [float]$l = [float]0
      [bool]$m  = [bool]$false
      $null = $v.GetMasterVolumeLevelScalar([ref]$l)
      $null = $v.GetMute([ref]$m)
      "$([Math]::Round($l * 100))|$m"
    `);
    const [volStr, muteStr] = out.split('|');
    const volumePercent = Math.min(100, Math.max(0, Number(volStr.trim()) || 0));
    const muted = muteStr.trim() === 'True';

    // ── Device list via CIM — no COM vtable needed ────────────────────────
    // Win32_SoundDevice gives friendly names for all active audio endpoints.
    let devices: AudioDevice[] = [];
    let activeDeviceName = 'Default Output';
    try {
      const devOut = await psRun(`
        Get-CimInstance -ClassName Win32_SoundDevice |
          Where-Object { $_.Status -eq 'OK' } |
          ForEach-Object { $_.Name }
      `);
      const names = devOut.split('\n').map((s) => s.trim()).filter(Boolean);
      if (names.length > 0) {
        activeDeviceName = names[0];
        devices = names.map((name, i) => ({ id: name, name, isDefault: i === 0 }));
      }
    } catch { /* leave devices as empty — widget shows nothing wrong */ }

    if (devices.length === 0) {
      devices = [{ id: 'default', name: activeDeviceName, isDefault: true }];
    }

    return { volumePercent, muted, activeDeviceName, devices };
  }
}

// ── Windows — per-app session mixer ──────────────────────────────────────

async function winGetSessions(): Promise<AudioSession[]> {
  const out = await psRun(`
    ${WASAPI}
    $procs = @{}
    Get-Process | ForEach-Object { $procs[[int]$_.Id] = $_.Name }

    $se = Get-SessionEnum
    [int]$count = 0
    $null = $se.GetCount([ref]$count)
    $seen = @{}
    $lines = [System.Collections.Generic.List[string]]::new()

    for ($i = 0; $i -lt $count; $i++) {
      $ctrl = $null
      $null = $se.GetSession($i, [ref]$ctrl)

      [int]$state = 0
      $null = $ctrl.GetState([ref]$state)
      if ($state -ne 1) { continue }

      [uint32]$pid = 0
      $null = $ctrl.GetProcessId([ref]$pid)
      if ($seen.ContainsKey([int]$pid)) { continue }
      $seen[[int]$pid] = $true

      $isSys = ($ctrl.IsSystemSoundsSession() -eq 0)

      [string]$dn = ""
      $null = $ctrl.GetDisplayName([ref]$dn)
      $name = if ($isSys -or $pid -eq 0) {
        "System Sounds"
      } elseif ($dn -and !$dn.StartsWith("@")) {
        $dn
      } elseif ($procs.ContainsKey([int]$pid)) {
        $procs[[int]$pid]
      } else { "Unknown ($pid)" }

      $sav = $ctrl -as [ISimpleAudioVolume]
      [float]$l = [float]0
      [bool]$m  = [bool]$false
      $null = $sav.GetMasterVolume([ref]$l)
      $null = $sav.GetMute([ref]$m)

      $lines.Add("$pid|$name|$([Math]::Round($l * 100))|$m")
    }
    $lines -join "\`n"
  `);

  if (!out) return [];
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [pidStr, name, volStr, mutedStr] = line.split('|');
      return {
        pid: Number(pidStr),
        name: name.trim(),
        volumePercent: Number(volStr),
        muted: mutedStr.trim() === 'True',
      };
    });
}

async function winSetSessionVolume(pid: number, vol: number): Promise<void> {
  const scalar = (vol / 100).toFixed(6);
  await psRun(`
    ${WASAPI}
    $targetPid = ${pid}
    $se = Get-SessionEnum
    [int]$count = 0
    $null = $se.GetCount([ref]$count)
    $g = [Guid]::Empty
    for ($i = 0; $i -lt $count; $i++) {
      $ctrl = $null
      $null = $se.GetSession($i, [ref]$ctrl)
      [uint32]$p = 0
      $null = $ctrl.GetProcessId([ref]$p)
      if ($p -ne $targetPid) { continue }
      $null = ($ctrl -as [ISimpleAudioVolume]).SetMasterVolume([float]${scalar}, [ref]$g)
    }
  `);
}

async function winGetData(): Promise<SoundData> {
  // Run device query and session enumeration in parallel
  const [deviceData, sessions] = await Promise.all([
    winGetDeviceData(),
    winGetSessions().catch((): AudioSession[] => []),
  ]);
  return { ...deviceData, sessions };
}

async function winSetVolume(vol: number): Promise<void> {
  try {
    await psRun(`Set-AudioDevice -PlaybackVolume ${Math.round(vol)}`);
  } catch {
    const scalar = (vol / 100).toFixed(6);
    await psRun(`
      ${WASAPI}
      $v = Get-AEV
      $g = [Guid]::Empty
      $null = $v.SetMasterVolumeLevelScalar([float]${scalar}, [ref]$g)
    `);
  }
}

async function winSetMute(muted: boolean): Promise<void> {
  try {
    await psRun(`Set-AudioDevice -PlaybackMute ${muted ? '$true' : '$false'}`);
  } catch {
    await psRun(`
      ${WASAPI}
      $v = Get-AEV
      $g = [Guid]::Empty
      $null = $v.SetMute([bool]${muted ? '$true' : '$false'}, [ref]$g)
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

  // Per-app session volume (Windows only — no-op response on macOS)
  fastify.post<{
    Body: { pid: number; volumePercent: number };
    Reply: { ok: boolean } | { error: string };
  }>('/sessions/volume', async (req, reply) => {
    const { pid, volumePercent } = req.body;
    if (typeof volumePercent !== 'number' || volumePercent < 0 || volumePercent > 100) {
      return reply.code(400).send({ error: 'volumePercent must be 0–100' });
    }
    if (process.platform !== 'win32') return reply.send({ ok: true });
    try {
      await winSetSessionVolume(pid, volumePercent);
      cache.clear();
      return reply.send({ ok: true });
    } catch (err) {
      return reply.code(502).send({ error: err instanceof Error ? err.message : String(err) });
    }
  });
};
