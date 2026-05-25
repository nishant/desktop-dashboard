export interface AudioDevice {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface AudioSession {
  pid: number;
  name: string;
  volumePercent: number;
  muted: boolean;
}

export interface SoundData {
  volumePercent: number;
  muted: boolean;
  activeDeviceName: string;
  devices: AudioDevice[];
  sessions: AudioSession[]; // empty on macOS
}
