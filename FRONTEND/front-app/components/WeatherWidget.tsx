"use client";

import { useState } from "react";

export interface DailyForecast {
  date: number;       // Unix timestamp
  temp_min: number;
  temp_max: number;
  temp_day: number;
  humidity: number;
  wind_speed: number;
  pop: number;        // precipitation probability %
  description: string;
  icon: string;
}

export interface WeatherData {
  timezone: string;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
  };
  daily: DailyForecast[];
}

interface Props {
  city: string;
  data: WeatherData;
}

function iconUrl(icon: string) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function formatDay(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function EyeOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function WeatherWidget({ city, data }: Props) {
  const { current, daily } = data;
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(true);

  if (!visible) {
    return (
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setVisible(true)}
          title="Show weather"
          className="flex items-center gap-1.5 rounded-lg border border-violet-700/40 bg-violet-950/60
                     px-3 py-1.5 text-xs text-violet-300/70 hover:text-violet-200 transition backdrop-blur-md"
        >
          <EyeOpen />
          Show weather
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-700/40 bg-violet-950/60 mb-6 backdrop-blur-md shadow-lg shadow-violet-950/30">
      {/* Widget toolbar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          Weather · {city}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand"}
            className="rounded-md p-1.5 text-violet-300/60 hover:text-violet-200 hover:bg-violet-800/40 transition"
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </button>
          <button
            onClick={() => setVisible(false)}
            title="Hide weather"
            className="rounded-md p-1.5 text-violet-300/60 hover:text-violet-200 hover:bg-violet-800/40 transition"
          >
            <EyeOff />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Current conditions */}
          <div className="flex items-center gap-3 mb-4">
            <img src={iconUrl(current.icon)} alt={current.description} width={56} height={56} className="shrink-0 drop-shadow" />
            <div>
              <p className="text-2xl font-bold text-white">{Math.round(current.temp)}°C</p>
              <p className="text-sm capitalize text-violet-200/80">{current.description}</p>
            </div>
            <div className="ml-auto text-right text-xs text-violet-300/70 leading-5">
              <div>Feels like {Math.round(current.feels_like)}°C</div>
              <div>Humidity {current.humidity}%</div>
              <div>Wind {Math.round(current.wind_speed * 3.6)} km/h</div>
            </div>
          </div>

          {/* 8-day daily strip */}
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-1">
              {daily.map((d) => (
                <div
                  key={d.date}
                  className="flex flex-col items-center rounded-xl border border-violet-700/30 bg-violet-900/40 px-3 py-2 min-w-[80px]"
                >
                  <p className="text-[10px] text-violet-300/70 text-center leading-tight mb-1">{formatDay(d.date)}</p>
                  <img src={iconUrl(d.icon)} alt={d.description} width={36} height={36} />
                  <p className="text-xs font-semibold text-white mt-1">
                    {Math.round(d.temp_max)}° <span className="text-violet-300/60 font-normal">{Math.round(d.temp_min)}°</span>
                  </p>
                  {d.pop > 10 && (
                    <p className="text-[10px] text-sky-400 mt-0.5">💧 {d.pop}%</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
