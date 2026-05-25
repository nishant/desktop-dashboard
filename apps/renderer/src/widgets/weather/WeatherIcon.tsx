import {
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning,
} from 'lucide-react';
import type { WeatherMeta } from './weatherCodes';

const ICON_MAP = {
  'sun':              Sun,
  'cloud-sun':        CloudSun,
  'cloud':            Cloud,
  'cloud-fog':        CloudFog,
  'cloud-drizzle':    CloudDrizzle,
  'cloud-rain':       CloudRain,
  'cloud-snow':       CloudSnow,
  'cloud-lightning':  CloudLightning,
} as const;

interface WeatherIconProps {
  icon: WeatherMeta['icon'];
  className?: string;
}

export function WeatherIcon({ icon, className }: WeatherIconProps) {
  const Icon = ICON_MAP[icon];
  return <Icon className={className} />;
}
