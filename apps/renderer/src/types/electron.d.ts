import type { ElectronAPI } from '@dash/shared';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
