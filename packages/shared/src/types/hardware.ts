export interface CpuData {
  usagePercent: number;
  coreUsage: number[];
  speedGhz: number;
  tempCelsius: number | null;
}

export interface GpuData {
  usagePercent: number;
  vramUsedMb: number;
  vramTotalMb: number;
  tempCelsius: number | null;
}

export interface DiskIo {
  name: string;
  readMBs: number;
  writeMBs: number;
}

export interface NetworkIo {
  iface: string;
  uploadMbps: number;
  downloadMbps: number;
}

export interface HardwareData {
  cpu: CpuData;
  gpu: GpuData | null;
  ram: { usedMb: number; totalMb: number; usagePercent: number };
  disks: DiskIo[];
  network: NetworkIo[];
  fetchedAt: string;
}
