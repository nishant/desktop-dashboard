import { useEffect, useRef } from 'react';
import { Droplets, Wind, Zap, Umbrella } from 'lucide-react';
import { useWeather } from './useWeather';
import { getWeatherMeta } from './weatherCodes';
import { WeatherIcon } from './WeatherIcon';

function formatHour(isoTime: string): string {
  const date = new Date(isoTime);
  const h = date.getHours();
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function WeatherWidget() {
  const { data, isLoading, isError } = useWeather();
  const hourlyRef = useRef<HTMLDivElement>(null);

  // Wheel: map vertical scroll to horizontal. Drag: click-and-drag to pan.
  useEffect(() => {
    const el = hourlyRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) return; // let native horizontal scroll through
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX;
      startScrollLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      el.scrollLeft = startScrollLeft - (e.pageX - startX);
    };

    const onMouseUp = () => {
      isDragging = false;
      el.style.cursor = '';
      el.style.userSelect = '';
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-zinc-600 text-sm">Loading…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-red-500 text-sm">Failed to load weather</span>
      </div>
    );
  }

  const { current, hourly, daily } = data;
  const meta = getWeatherMeta(current.weatherCode);

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-hidden">

      {/* Current conditions */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-light text-zinc-100 leading-none">{current.temp}°</span>
            <span className="text-zinc-400 text-base mb-1">F</span>
          </div>
          <p className="text-zinc-400 text-sm mt-1">{meta.label}</p>
          <p className="text-zinc-600 text-xs mt-0.5">Austin, TX</p>
        </div>
        <WeatherIcon icon={meta.icon} className="w-14 h-14 text-zinc-300 shrink-0" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        {[
          { icon: <Droplets className="w-3.5 h-3.5" />, label: 'Humidity', value: `${current.humidity}%` },
          { icon: <Wind className="w-3.5 h-3.5" />,     label: 'Wind',     value: `${current.windSpeed}mph` },
          { icon: <Umbrella className="w-3.5 h-3.5" />, label: 'Rain',     value: `${current.precipChance}%` },
          { icon: <Zap className="w-3.5 h-3.5" />,      label: 'UV',       value: `${Math.round(current.uvIndex)}` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-zinc-800/60 rounded-lg p-2 flex flex-col items-center gap-1">
            <span className="text-zinc-500">{icon}</span>
            <span className="text-zinc-100 text-sm font-medium">{value}</span>
            <span className="text-zinc-600 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Feels like */}
      <p className="text-zinc-500 text-xs shrink-0">Feels like {current.feelsLike}°F</p>

      {/* Hourly strip */}
      <div className="shrink-0">
        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Hourly</p>
        <div ref={hourlyRef} className="flex gap-2 overflow-x-auto scrollbar-none cursor-grab select-none">
          {hourly.map((h) => {
            const hMeta = getWeatherMeta(h.weatherCode);
            return (
              <div key={h.time} className="flex flex-col items-center gap-1 shrink-0 min-w-[44px]">
                <span className="text-zinc-500 text-xs">{formatHour(h.time)}</span>
                <WeatherIcon icon={hMeta.icon} className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300 text-xs font-medium">{h.temp}°</span>
                {h.precipChance > 20 && (
                  <span className="text-blue-400 text-xs">{h.precipChance}%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily strip */}
      <div className="flex-1 min-h-0">
        <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">5-Day</p>
        <div className="flex flex-col gap-1.5">
          {daily.map((d) => {
            const dMeta = getWeatherMeta(d.weatherCode);
            return (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs w-8 shrink-0">{formatDay(d.date)}</span>
                <WeatherIcon icon={dMeta.icon} className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500/40 rounded-full"
                    style={{ width: `${d.precipChance}%` }}
                  />
                </div>
                <span className="text-zinc-300 text-xs w-14 shrink-0 text-right">
                  {d.tempMax}° / {d.tempMin}°
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
