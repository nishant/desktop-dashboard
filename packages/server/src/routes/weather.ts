import type { FastifyPluginAsync } from 'fastify';
import type { WeatherData } from '@dash/shared';
import { SimpleCache } from '../cache/SimpleCache';

const TTL_MS = 15 * 60 * 1000;

// ── IP geolocation ────────────────────────────────────────────────────────────

interface IpGeo { lat: number; lon: number; timezone: string; city: string; regionName: string; }

const geoCache = new SimpleCache<IpGeo>();

async function getGeoFromIp(): Promise<IpGeo> {
  const cached = geoCache.get();
  if (cached) return cached;
  // ip-api.com: free, no key, 45 req/min — more than enough (we cache for 15 min)
  const res = await fetch('http://ip-api.com/json/?fields=lat,lon,timezone,city,regionName');
  if (!res.ok) throw new Error(`ip-api error ${res.status}`);
  const geo = await res.json() as IpGeo;
  geoCache.set(geo, 60 * 60 * 1000); // cache IP geo for 1 hour
  return geo;
}

// ── Weather fetch ─────────────────────────────────────────────────────────────

const weatherCache = new SimpleCache<WeatherData>();

function buildUrl(lat: number, lon: number, timezone: string): string {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', [
    'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
    'precipitation_probability', 'weathercode', 'windspeed_10m', 'uv_index',
  ].join(','));
  url.searchParams.set('hourly', [
    'temperature_2m', 'precipitation_probability', 'weathercode',
  ].join(','));
  url.searchParams.set('daily', [
    'weathercode', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max',
  ].join(','));
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('windspeed_unit', 'mph');
  url.searchParams.set('timezone', timezone);
  url.searchParams.set('forecast_days', '6');
  return url.toString();
}

async function fetchWeather(lat: number, lon: number, timezone: string): Promise<WeatherData> {
  const res = await fetch(buildUrl(lat, lon, timezone));
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);

  const raw = await res.json() as {
    current: {
      time: string;
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      precipitation_probability: number;
      weathercode: number;
      windspeed_10m: number;
      uv_index: number;
    };
    hourly: {
      time: string[];
      temperature_2m: number[];
      precipitation_probability: number[];
      weathercode: number[];
    };
    daily: {
      time: string[];
      weathercode: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
    };
  };

  const nowHour = raw.current.time.slice(0, 13);
  const hourIdx = raw.hourly.time.findIndex((t) => t.startsWith(nowHour));
  const startIdx = hourIdx >= 0 ? hourIdx : 0;

  return {
    current: {
      temp: Math.round(raw.current.temperature_2m),
      feelsLike: Math.round(raw.current.apparent_temperature),
      humidity: raw.current.relative_humidity_2m,
      windSpeed: Math.round(raw.current.windspeed_10m),
      uvIndex: raw.current.uv_index,
      precipChance: raw.current.precipitation_probability,
      weatherCode: raw.current.weathercode,
    },
    hourly: raw.hourly.time.slice(startIdx, startIdx + 12).map((time, i) => ({
      time,
      temp: Math.round(raw.hourly.temperature_2m[startIdx + i]),
      precipChance: raw.hourly.precipitation_probability[startIdx + i],
      weatherCode: raw.hourly.weathercode[startIdx + i],
    })),
    daily: raw.daily.time.slice(0, 5).map((date, i) => ({
      date,
      tempMax: Math.round(raw.daily.temperature_2m_max[i]),
      tempMin: Math.round(raw.daily.temperature_2m_min[i]),
      precipChance: raw.daily.precipitation_probability_max[i],
      weatherCode: raw.daily.weathercode[i],
    })),
    fetchedAt: new Date().toISOString(),
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export const weatherRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: WeatherData }>('/', async (_req, reply) => {
    const cached = weatherCache.get();
    if (cached) return reply.send(cached);

    const geo = await getGeoFromIp();
    const data = await fetchWeather(geo.lat, geo.lon, geo.timezone);
    weatherCache.set(data, TTL_MS);
    return reply.send(data);
  });
};
