import type { FastifyPluginAsync } from 'fastify';
import type { WeatherData } from '@dash/shared';
import { SimpleCache } from '../cache/SimpleCache';

const LAT = 30.2672;
const LON = -97.7431;
const TTL_MS = 15 * 60 * 1000;

const cache = new SimpleCache<WeatherData>();

const FORECAST_URL = new URL('https://api.open-meteo.com/v1/forecast');
FORECAST_URL.searchParams.set('latitude', String(LAT));
FORECAST_URL.searchParams.set('longitude', String(LON));
FORECAST_URL.searchParams.set('current', [
  'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
  'precipitation_probability', 'weathercode', 'windspeed_10m', 'uv_index',
].join(','));
FORECAST_URL.searchParams.set('hourly', [
  'temperature_2m', 'precipitation_probability', 'weathercode',
].join(','));
FORECAST_URL.searchParams.set('daily', [
  'weathercode', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max',
].join(','));
FORECAST_URL.searchParams.set('temperature_unit', 'fahrenheit');
FORECAST_URL.searchParams.set('windspeed_unit', 'mph');
FORECAST_URL.searchParams.set('timezone', 'America/Chicago');
FORECAST_URL.searchParams.set('forecast_days', '6');

async function fetchWeather(): Promise<WeatherData> {
  const res = await fetch(FORECAST_URL.toString());
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

  // Find the index of the current hour in the hourly array
  const nowHour = raw.current.time.slice(0, 13); // "YYYY-MM-DDTHH"
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

export const weatherRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: WeatherData }>('/', async (_req, reply) => {
    const cached = cache.get();
    if (cached) return reply.send(cached);

    const data = await fetchWeather();
    cache.set(data, TTL_MS);
    return reply.send(data);
  });
};
