"use client";

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
  return new Date(ts * 1000).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export default function WeatherWidget({ city, data }: Props) {
  const { current, daily } = data;

  return (
    <div className="rounded-2xl border border-violet-700/40 bg-violet-950/60 p-4 mb-6 backdrop-blur-md shadow-lg shadow-violet-950/30">
      {/* Header — current conditions */}
      <div className="flex items-center gap-3 mb-4">
        <img src={iconUrl(current.icon)} alt={current.description} width={56} height={56} className="shrink-0 drop-shadow" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Météo · {city}</p>
          <p className="text-2xl font-bold text-white">{Math.round(current.temp)}°C</p>
          <p className="text-sm capitalize text-violet-200/80">{current.description}</p>
        </div>
        <div className="ml-auto text-right text-xs text-violet-300/70 leading-5">
          <div>Ressenti {Math.round(current.feels_like)}°C</div>
          <div>Humidité {current.humidity}%</div>
          <div>Vent {Math.round(current.wind_speed * 3.6)} km/h</div>
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
  );
}
