import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Cpu, Thermometer, HardDrive, Wifi, Battery, BatteryCharging, BarChart2, Activity } from 'lucide-react';
import { useHardware, type HardwareHistory } from './useHardware';
import type { HardwareData } from '@dash/shared';

// ── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number, dec = 1): string {
  return n.toFixed(dec);
}

function fmtUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function tempColor(c: number | null): string {
  if (c === null) return 'text-zinc-500';
  if (c >= 85) return 'text-red-400';
  if (c >= 70) return 'text-amber-400';
  return 'text-emerald-400';
}

type ViewMode = 'bars' | 'sparks';

// ── Sparkline ────────────────────────────────────────────────────────────

function Spark({ data, color }: { data: number[]; color: string }) {
  const points = data.map((v) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Area
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.15}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Usage bar ────────────────────────────────────────────────────────────

function UsageBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Per-core mini bars ────────────────────────────────────────────────────

function CoreGrid({ coreUsage }: { coreUsage: number[] }) {
  if (coreUsage.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-0.5 mt-1.5">
      {coreUsage.map((load, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: 10 }}>
          <div className="w-2.5 bg-zinc-800 rounded-sm overflow-hidden" style={{ height: 20 }}>
            <div
              className="w-full rounded-sm"
              style={{
                height: `${load}%`,
                backgroundColor: load >= 85 ? '#f87171' : load >= 60 ? '#fbbf24' : '#60a5fa',
                marginTop: 'auto',
                transition: 'height 0.3s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-800/50 rounded-lg p-3 ${className}`}>
      {children}
    </div>
  );
}

// ── CPU card ─────────────────────────────────────────────────────────────

function CpuCard({ cpu, history, view }: { cpu: HardwareData['cpu']; history: HardwareHistory; view: ViewMode }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Cpu size={12} className="text-blue-400" />
          <span className="text-xs text-zinc-400 font-medium truncate max-w-[160px]">{cpu.brand}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cpu.tempCelsius !== null && (
            <span className={`text-xs font-mono ${tempColor(cpu.tempCelsius)}`}>
              {cpu.tempCelsius}°C
            </span>
          )}
          <span className="text-sm font-semibold text-white tabular-nums">{cpu.usagePercent}%</span>
        </div>
      </div>

      {view === 'sparks' ? (
        <Spark data={history.cpuUsage} color="#60a5fa" />
      ) : (
        <UsageBar pct={cpu.usagePercent} color="#60a5fa" />
      )}

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-zinc-500">
          {cpu.physicalCores}C/{cpu.cores}T · {fmt(cpu.speedGhz)} GHz
        </span>
      </div>

      <CoreGrid coreUsage={cpu.coreUsage} />
    </Card>
  );
}

// ── GPU card ─────────────────────────────────────────────────────────────

function GpuCard({ gpu, history, view }: { gpu: HardwareData['gpu']; history: HardwareHistory; view: ViewMode }) {
  if (!gpu) return null;

  const vramPct = gpu.vramTotalMb > 0 ? Math.round((gpu.vramUsedMb / gpu.vramTotalMb) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-400 font-medium truncate max-w-[160px]">{gpu.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          {gpu.tempCelsius !== null && (
            <span className={`text-xs font-mono ${tempColor(gpu.tempCelsius)}`}>
              {gpu.tempCelsius}°C
            </span>
          )}
          <span className="text-sm font-semibold text-white tabular-nums">{gpu.usagePercent}%</span>
        </div>
      </div>

      {view === 'sparks' ? (
        <Spark data={history.gpuUsage} color="#c084fc" />
      ) : (
        <UsageBar pct={gpu.usagePercent} color="#c084fc" />
      )}

      {gpu.vramTotalMb > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>VRAM</span>
            <span>{fmt(gpu.vramUsedMb / 1024)} / {fmt(gpu.vramTotalMb / 1024)} GB · {vramPct}%</span>
          </div>
          <UsageBar pct={vramPct} color="#a855f7" />
        </div>
      )}

      {gpu.clockMhz !== null && (
        <div className="mt-1">
          <span className="text-[10px] text-zinc-500">{gpu.clockMhz} MHz</span>
        </div>
      )}
    </Card>
  );
}

// ── RAM card ──────────────────────────────────────────────────────────────

function RamCard({ ram, history, view }: { ram: HardwareData['ram']; history: HardwareHistory; view: ViewMode }) {
  const totalGb = ram.totalMb / 1024;
  const usedGb = ram.usedMb / 1024;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-400 font-medium">RAM</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 tabular-nums">
            {fmt(usedGb)} / {fmt(totalGb, 0)} GB
          </span>
          <span className="text-sm font-semibold text-white tabular-nums">{ram.usagePercent}%</span>
        </div>
      </div>

      {view === 'sparks' ? (
        <Spark data={history.ramUsage} color="#fbbf24" />
      ) : (
        <UsageBar pct={ram.usagePercent} color="#fbbf24" />
      )}

      {ram.swapTotalMb > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Swap</span>
            <span>{fmt(ram.swapUsedMb / 1024)} / {fmt(ram.swapTotalMb / 1024)} GB</span>
          </div>
          <UsageBar
            pct={Math.round((ram.swapUsedMb / ram.swapTotalMb) * 100)}
            color="#f59e0b"
          />
        </div>
      )}
    </Card>
  );
}

// ── Disk card ─────────────────────────────────────────────────────────────

function DiskCard({ disks, diskUsage, history, view }: {
  disks: HardwareData['disks'];
  diskUsage: HardwareData['diskUsage'];
  history: HardwareHistory;
  view: ViewMode;
}) {
  const d = disks[0];
  if (!d) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <HardDrive size={12} className="text-orange-400" />
          <span className="text-xs text-zinc-400 font-medium">Disk I/O</span>
        </div>
        <div className="flex gap-3 text-[10px] tabular-nums">
          <span className="text-emerald-400">R {fmt(d.readMBs)} MB/s</span>
          <span className="text-orange-400">W {fmt(d.writeMBs)} MB/s</span>
        </div>
      </div>

      {view === 'sparks' && (
        <div className="space-y-1">
          <Spark data={history.diskRead} color="#34d399" />
          <Spark data={history.diskWrite} color="#fb923c" />
        </div>
      )}

      {diskUsage.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {diskUsage.map((du) => (
            <div key={du.mount}>
              <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
                <span className="font-mono">{du.mount}</span>
                <span>{fmt(du.usedGb, 0)} / {fmt(du.totalGb, 0)} GB · {du.usePercent}%</span>
              </div>
              <UsageBar pct={du.usePercent} color={du.usePercent >= 85 ? '#f87171' : '#fb923c'} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Network card ──────────────────────────────────────────────────────────

function NetworkCard({ network, history, view }: {
  network: HardwareData['network'];
  history: HardwareHistory;
  view: ViewMode;
}) {
  const totalUp = history.netUp[history.netUp.length - 1] ?? 0;
  const totalDown = history.netDown[history.netDown.length - 1] ?? 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Wifi size={12} className="text-sky-400" />
          <span className="text-xs text-zinc-400 font-medium">Network</span>
        </div>
        <div className="flex gap-3 text-[10px] tabular-nums">
          <span className="text-sky-400">↑ {fmt(totalUp)} Mbps</span>
          <span className="text-emerald-400">↓ {fmt(totalDown)} Mbps</span>
        </div>
      </div>

      {view === 'sparks' && (
        <div className="space-y-1">
          <Spark data={history.netUp} color="#38bdf8" />
          <Spark data={history.netDown} color="#34d399" />
        </div>
      )}

      {network.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {network.map((n) => (
            <span key={n.iface} className="text-[10px] text-zinc-500 font-mono">{n.iface}</span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Battery row ───────────────────────────────────────────────────────────

function BatteryRow({ battery }: { battery: NonNullable<HardwareData['battery']> }) {
  const Icon = battery.charging ? BatteryCharging : Battery;
  const color = battery.percent <= 20 ? 'text-red-400' : battery.percent <= 40 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={color} />
          <span className="text-xs text-zinc-400">Battery</span>
          {battery.charging && <span className="text-[10px] text-emerald-400">Charging</span>}
        </div>
        <span className={`text-sm font-semibold tabular-nums ${color}`}>{battery.percent}%</span>
      </div>
      <div className="mt-1.5">
        <UsageBar pct={battery.percent} color={battery.percent <= 20 ? '#f87171' : battery.percent <= 40 ? '#fbbf24' : '#34d399'} />
      </div>
    </Card>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────

export function HardwareWidget() {
  const { query, history } = useHardware();
  const [view, setView] = useState<ViewMode>('bars');

  if (query.isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-center h-full">
        <span className="text-zinc-500 text-sm">Loading hardware…</span>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-center h-full">
        <span className="text-red-400 text-sm">Failed to load hardware data</span>
      </div>
    );
  }

  const d = query.data;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 flex flex-col gap-2 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Cpu size={14} className="text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200">Hardware</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800 rounded-md p-0.5">
          <button
            onClick={() => setView('bars')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              view === 'bars'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart2 size={10} />
            Bars
          </button>
          <button
            onClick={() => setView('sparks')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              view === 'sparks'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Activity size={10} />
            Sparks
          </button>
        </div>
      </div>

      {/* Cards */}
      <CpuCard cpu={d.cpu} history={history} view={view} />
      <GpuCard gpu={d.gpu} history={history} view={view} />
      <RamCard ram={d.ram} history={history} view={view} />
      <DiskCard disks={d.disks} diskUsage={d.diskUsage} history={history} view={view} />
      {d.network.length > 0 && <NetworkCard network={d.network} history={history} view={view} />}
      {d.battery && <BatteryRow battery={d.battery} />}

      {/* Footer */}
      <div className="flex items-center justify-between px-0.5 shrink-0">
        <div className="flex items-center gap-1">
          <Thermometer size={10} className="text-zinc-600" />
          <span className="text-[10px] text-zinc-600">Uptime {fmtUptime(d.uptime)}</span>
        </div>
        {query.isFetching && (
          <span className="text-[10px] text-zinc-700">updating…</span>
        )}
      </div>
    </div>
  );
}
