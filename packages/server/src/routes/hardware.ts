import type { FastifyPluginAsync } from 'fastify';
import type { HardwareData, CpuData, GpuData, DiskIo, DiskUsage, NetworkIo } from '@dash/shared';
import si from 'systeminformation';
import os from 'os';
import { SimpleCache } from '../cache/SimpleCache';

const cache = new SimpleCache<HardwareData>();
// 900ms TTL — renderer polls every 1s, prevents duplicate work if two requests land close together
const TTL_MS = 900;

// CPU brand/core count/speed never changes at runtime — fetch once
let staticCpu: { brand: string; cores: number; physicalCores: number; speedGhz: number } | null = null;
async function getStaticCpu() {
  if (staticCpu) return staticCpu;
  const c = await si.cpu();
  staticCpu = { brand: c.brand, cores: c.cores, physicalCores: c.physicalCores, speedGhz: c.speed ?? 0 };
  return staticCpu;
}

function pickGpu(controllers: si.Systeminformation.GraphicsControllerData[]): GpuData | null {
  if (controllers.length === 0) return null;

  // Prefer the controller with most VRAM (dGPU > iGPU on desktop/gaming)
  const sorted = [...controllers].sort((a, b) => (b.vram ?? 0) - (a.vram ?? 0));
  const ctrl = sorted[0];

  // Skip truly empty entries (no vendor, no model)
  if (!ctrl.vendor && !ctrl.model) return null;

  const vramTotal = ctrl.vramDynamic
    ? 0 // Apple unified memory — dynamic, not fixed
    : (ctrl.memoryTotal ?? ctrl.vram ?? 0);

  const vramUsed = ctrl.memoryUsed ?? 0;

  return {
    name: ctrl.model || ctrl.vendor || 'GPU',
    usagePercent: ctrl.utilizationGpu ?? 0,
    vramUsedMb: vramUsed,
    vramTotalMb: vramTotal,
    tempCelsius: ctrl.temperatureGpu && ctrl.temperatureGpu > 0 ? ctrl.temperatureGpu : null,
    clockMhz: ctrl.clockCore && ctrl.clockCore > 0 ? ctrl.clockCore : null,
  };
}

// Virtual / snap filesystems to exclude from disk usage
const SKIP_FS_TYPES = new Set(['squashfs', 'tmpfs', 'devtmpfs', 'overlay', 'nsfs', 'efivarfs']);
const SKIP_MOUNT_PREFIXES = ['/boot', '/sys', '/proc', '/dev', '/run', '/snap', '/System/Volumes/'];

function isUsefulFs(fs: si.Systeminformation.FsSizeData): boolean {
  if (SKIP_FS_TYPES.has(fs.type)) return false;
  if (SKIP_MOUNT_PREFIXES.some((p) => fs.mount.startsWith(p))) return false;
  if (fs.size <= 0) return false;
  return true;
}

const LOOPBACK_IFACES = new Set(['lo', 'lo0', 'Loopback Pseudo-Interface 1']);

function isRealIface(iface: string): boolean {
  if (LOOPBACK_IFACES.has(iface)) return false;
  if (iface.toLowerCase().startsWith('loopback')) return false;
  return true;
}

async function buildHardwareData(): Promise<HardwareData> {
  const [
    cpuStatic,
    currentLoad,
    cpuTemp,
    graphics,
    mem,
    fsStats,
    fsSize,
    netStats,
    batteryInfo,
  ] = await Promise.all([
    getStaticCpu(),
    si.currentLoad(),
    si.cpuTemperature().catch(() => null),
    si.graphics().catch(() => ({ controllers: [], displays: [] })),
    si.mem(),
    si.fsStats().catch(() => null),
    si.fsSize().catch(() => [] as si.Systeminformation.FsSizeData[]),
    si.networkStats().catch(() => [] as si.Systeminformation.NetworkStatsData[]),
    si.battery().catch(() => null),
  ]);

  // ── CPU ────────────────────────────────────────────────────────────────
  const cpu: CpuData = {
    brand: cpuStatic.brand,
    cores: cpuStatic.cores,
    physicalCores: cpuStatic.physicalCores,
    usagePercent: Math.round(currentLoad.currentLoad),
    coreUsage: (currentLoad.cpus ?? []).map((c) => Math.round(c.load)),
    speedGhz: cpuStatic.speedGhz,
    tempCelsius: cpuTemp && cpuTemp.main > 0 ? Math.round(cpuTemp.main) : null,
  };

  // ── GPU ───────────────────────────────────────────────────────────────
  const gpu = pickGpu(graphics.controllers ?? []);

  // ── RAM ───────────────────────────────────────────────────────────────
  // Use active (actually in use) rather than used (includes buffers/cache) for macOS accuracy
  const ramActive = mem.active > 0 ? mem.active : mem.used;
  const ram = {
    usedMb: Math.round(ramActive / 1024 / 1024),
    totalMb: Math.round(mem.total / 1024 / 1024),
    usagePercent: Math.round((ramActive / mem.total) * 100),
    swapUsedMb: Math.round((mem.swapused ?? 0) / 1024 / 1024),
    swapTotalMb: Math.round((mem.swaptotal ?? 0) / 1024 / 1024),
  };

  // ── Disk I/O (aggregate via fsStats — bytes/sec) ─────────────────────
  const disks: DiskIo[] = [
    {
      name: 'Total',
      readMBs: fsStats ? parseFloat(((fsStats.rx_sec ?? 0) / 1024 / 1024).toFixed(2)) : 0,
      writeMBs: fsStats ? parseFloat(((fsStats.wx_sec ?? 0) / 1024 / 1024).toFixed(2)) : 0,
    },
  ];

  // ── Disk usage (per mount) ────────────────────────────────────────────
  const diskUsage: DiskUsage[] = (fsSize as si.Systeminformation.FsSizeData[])
    .filter(isUsefulFs)
    .map((f) => ({
      mount: f.mount,
      usedGb: parseFloat((f.used / 1024 / 1024 / 1024).toFixed(1)),
      totalGb: parseFloat((f.size / 1024 / 1024 / 1024).toFixed(1)),
      usePercent: Math.round(f.use),
    }))
    .slice(0, 6); // cap at 6 entries

  // ── Network ───────────────────────────────────────────────────────────
  const network: NetworkIo[] = (netStats as si.Systeminformation.NetworkStatsData[])
    .filter((n) => isRealIface(n.iface) && n.operstate !== 'down')
    .map((n) => ({
      iface: n.iface,
      uploadMbps: parseFloat(((n.tx_sec ?? 0) * 8 / 1_000_000).toFixed(2)),
      downloadMbps: parseFloat(((n.rx_sec ?? 0) * 8 / 1_000_000).toFixed(2)),
    }))
    .filter((n) => n.uploadMbps > 0 || n.downloadMbps > 0)
    .slice(0, 4);

  // ── Battery ───────────────────────────────────────────────────────────
  let battery: HardwareData['battery'] = null;
  if (batteryInfo?.hasBattery) {
    battery = {
      percent: Math.round(batteryInfo.percent),
      charging: batteryInfo.isCharging,
    };
  }

  return {
    cpu,
    gpu,
    ram,
    disks,
    diskUsage,
    network,
    uptime: Math.floor(os.uptime()),
    battery,
    fetchedAt: new Date().toISOString(),
  };
}

export const hardwareRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: HardwareData | { error: string } }>('/', async (_req, reply) => {
    const cached = cache.get();
    if (cached) return reply.send(cached);
    try {
      const data = await buildHardwareData();
      cache.set(data, TTL_MS);
      return reply.send(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fastify.log.error(`[hardware] ${msg}`);
      return reply.code(502).send({ error: msg });
    }
  });
};
