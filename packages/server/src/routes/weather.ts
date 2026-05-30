import type { FastifyPluginAsync } from 'fastify';
import type { WeatherData } from '@dash/shared';
import { SimpleCache } from '../cache/SimpleCache';

const TTL_MS = 15 * 60 * 1000;

// Cache keyed by "lat,lon" rounded to 2 decimal places (~1 km precision)
const caches = new Map<string, SimpleCache<WeatherData>>();

function getCache(lat: number, lon: number): SimpleCache<WeatherData> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (!caches.has(key)) caches.set(key, new SimpleCache<WeatherData>());
  return caches.get(key)!;
}

function buildUrl(lat: number, lon: number): string {
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
  url.searchParams.set('timezone', 'auto');   // inferred from coordinates
  url.searchParams.set('forecast_days', '6');
  return url.toString();
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(buildUrl(lat, lon));
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

type Qs = { lat: string; lon: string };

export const weatherRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: Qs; Reply: WeatherData }>('/', async (req, reply) => {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return reply.code(400).send({ error: 'lat and lon query params required' } as unknown as WeatherData);
    }

    const cache = getCache(lat, lon);
    const cached = cache.get();
    if (cached) return reply.send(cached);

    const data = await fetchWeather(lat, lon);
    cache.set(data, TTL_MS);
    return reply.send(data);
  });
};
