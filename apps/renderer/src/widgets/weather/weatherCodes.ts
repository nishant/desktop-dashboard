export interface WeatherMeta {
  label: string;
  icon: 'sun' | 'cloud-sun' | 'cloud' | 'cloud-fog' | 'cloud-drizzle' | 'cloud-rain' | 'cloud-snow' | 'cloud-lightning';
}

const CODES: Record<number, WeatherMeta> = {
  0:  { label: 'Clear',              icon: 'sun' },
  1:  { label: 'Mainly Clear',       icon: 'sun' },
  2:  { label: 'Partly Cloudy',      icon: 'cloud-sun' },
  3:  { label: 'Overcast',           icon: 'cloud' },
  45: { label: 'Foggy',              icon: 'cloud-fog' },
  48: { label: 'Icy Fog',            icon: 'cloud-fog' },
  51: { label: 'Light Drizzle',      icon: 'cloud-drizzle' },
  53: { label: 'Drizzle',            icon: 'cloud-drizzle' },
  55: { label: 'Heavy Drizzle',      icon: 'cloud-drizzle' },
  61: { label: 'Light Rain',         icon: 'cloud-rain' },
  63: { label: 'Rain',               icon: 'cloud-rain' },
  65: { label: 'Heavy Rain',         icon: 'cloud-rain' },
  71: { label: 'Light Snow',         icon: 'cloud-snow' },
  73: { label: 'Snow',               icon: 'cloud-snow' },
  75: { label: 'Heavy Snow',         icon: 'cloud-snow' },
  77: { label: 'Snow Grains',        icon: 'cloud-snow' },
  80: { label: 'Light Showers',      icon: 'cloud-rain' },
  81: { label: 'Showers',            icon: 'cloud-rain' },
  82: { label: 'Heavy Showers',      icon: 'cloud-rain' },
  85: { label: 'Snow Showers',       icon: 'cloud-snow' },
  86: { label: 'Heavy Snow Showers', icon: 'cloud-snow' },
  95: { label: 'Thunderstorm',       icon: 'cloud-lightning' },
  96: { label: 'Thunderstorm',       icon: 'cloud-lightning' },
  99: { label: 'Thunderstorm',       icon: 'cloud-lightning' },
};

const FALLBACK: WeatherMeta = { label: 'Unknown', icon: 'cloud' };

export function getWeatherMeta(code: number): WeatherMeta {
  return CODES[code] ?? FALLBACK;
}
