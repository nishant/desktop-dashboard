export interface AudioDevice {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SoundData {
  volumePercent: number;
  muted: boolean;
  activeDeviceName: string;
  devices: AudioDevice[];
}
