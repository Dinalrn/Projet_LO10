"use client";

import { useState } from "react";
import { Event } from "@/types/event";
import type { DailyForecast } from "./WeatherWidget";
import EventDetailModal from "./EventDetailModal";

interface Props {
  event: Event;
  isSaved?: boolean;
  onToggleSave?: (event: Event) => Promise<void>;
  isRegistered?: boolean;
  onRegister?: (event: Event) => void;
  onShare?: (event: Event) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  ticketmaster: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  datatourisme: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  openagenda: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "data.culture.gouv.fr": "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
};

function sourceBadgeClass(source: string): string {
  return (
    SOURCE_COLORS[source] ??
    "bg-gray-100 text-gray-600 dark:bg-violet-900/40 dark:text-violet-300"
  );
}

function formatDate(date: string, time: string): string {
  if (!date) return "Date TBD";
  try {
    const d = new Date(`${date}T${time || "00:00"}`);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) + (time ? ` · ${time.slice(0, 5)}` : "");
  } catch {
    return date;
  }
}

function iconUrl(icon: string) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function matchDayForecast(daily: DailyForecast[], eventDate: string): DailyForecast | null {
  const target = new Date(eventDate + "T12:00:00").getTime() / 1000;
  // Find the daily entry whose date (noon) is closest to the event date
  let best: DailyForecast | null = null;
  let bestDiff = Infinity;
  for (const d of daily) {
    const diff = Math.abs(d.date - target);
    if (diff < bestDiff && diff < 60 * 60 * 36) { // within 36h
      bestDiff = diff;
      best = d;
    }
  }
  return best;
}

export default function EventCard({ event, isSaved = false, onToggleSave, isRegistered = false, onRegister, onShare }: Props) {
  const { title, description, category, date, time, location, price, image, source } = event;
  const [saving, setSaving] = useState(false);
  const [weatherDay, setWeatherDay] = useState<DailyForecast | null | "loading" | "error">(null);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSave = async () => {
    if (!onToggleSave) return;
    setSaving(true);
    try {
      await onToggleSave(event);
    } finally {
      setSaving(false);
    }
  };

  const handleWeather = async () => {
    if (weatherOpen) {
      setWeatherOpen(false);
      return;
    }
    setWeatherOpen(true);
    if (weatherDay !== null) return; // already fetched

    setWeatherDay("loading");
    try {
      const qs = location.lat && location.lon
        ? `lat=${location.lat}&lon=${location.lon}`
        : `city=${encodeURIComponent(location.city || location.name || "")}`;
      const res = await fetch(`/api/weather?${qs}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const match = matchDayForecast(data.daily ?? [], date);
      setWeatherDay(match ?? "error");
    } catch {
      setWeatherDay("error");
    }
  };

  return (
    <>
    {detailOpen && (
      <EventDetailModal
        event={event}
        isSaved={isSaved}
        isRegistered={isRegistered}
        onToggleSave={onToggleSave}
        onRegister={onRegister}
        onShare={onShare}
        onClose={() => setDetailOpen(false)}
      />
    )}
    <article
      onClick={() => setDetailOpen(true)}
      className="flex flex-col overflow-hidden rounded-2xl border border-violet-100
                 bg-white shadow-sm transition hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-0.5
                 cursor-pointer dark:border-violet-900/30 dark:bg-[#1a1730]">
      {/* Image */}
      <div className="relative h-40 w-full bg-gray-100 dark:bg-violet-950/50">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-gray-300 dark:text-violet-800/50">
            🎭
          </div>
        )}

        {/* Category pill */}
        {category && (
          <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5
                           text-xs font-medium text-white backdrop-blur-sm">
            {category}
          </span>
        )}

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onToggleSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={isSaved ? "Remove from saved" : "Save event"}
              className="rounded-full bg-black/60 p-1.5 backdrop-blur-sm
                         transition hover:bg-black/80 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill={isSaved ? "white" : "none"}
                stroke="white"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          )}
          {onRegister && (
            <button
              onClick={() => onRegister(event)}
              aria-label={isRegistered ? "Already registered" : "Register for event"}
              className={`rounded-full p-1.5 backdrop-blur-sm transition hover:bg-black/80
                ${isRegistered ? "bg-violet-600/90" : "bg-black/60"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="white"
                strokeWidth={2}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
                {isRegistered && <path strokeLinecap="round" strokeLinejoin="round" d="M8 14l2.5 2.5L16 13" />}
              </svg>
            </button>
          )}
          {onShare && (
            <button
              onClick={() => onShare(event)}
              aria-label="Send to a friend"
              className="rounded-full bg-black/60 p-1.5 backdrop-blur-sm transition hover:bg-black/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                   className="h-4 w-4" fill="none" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-violet-50">
          {title || "Untitled event"}
        </h2>

        {description && (
          <p className="line-clamp-2 text-xs text-gray-500 dark:text-violet-300/60">
            {description}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-1 pt-2 text-xs text-gray-500 dark:text-violet-300/70">
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>{formatDate(date, time)}</span>
          </div>

          {(location.city || location.name) && (
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <span className="truncate">
                {[location.name, location.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span>🎟️</span>
            <span>{price > 0 ? `${price} €` : "Free"}</span>
          </div>
        </div>

        {/* Weather button — only for events with a specific date         TODO : Implement this functionality either with an other api like Meteo France or limiting to limited time frame
        {date && (
          <button
            onClick={handleWeather}
            className="mt-1 flex items-center gap-1.5 rounded-lg border border-sky-700/50 bg-sky-950/50
                       px-2.5 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-900/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
            </svg>
            {weatherOpen ? "Hide weather outlet" : "How's the weather on this day ?"}
          </button>
        )} */}

        {/* Inline weather panel */}
        {weatherOpen && (
          <div className="mt-1 rounded-xl border border-gray-700 bg-gray-800 p-3 text-xs">
            {weatherDay === "loading" && (
              <p className="text-gray-400 text-center">Loading…</p>
            )}
            {weatherDay === "error" && (
              <p className="text-red-400 text-center">Weather is not avaible for this day</p>
            )}
            {weatherDay === null && null}
            {weatherDay && weatherDay !== "loading" && weatherDay !== "error" && (
              <div className="flex items-center gap-3">
                <img src={iconUrl(weatherDay.icon)} alt={weatherDay.description} width={44} height={44} />
                <div>
                  <p className="capitalize text-white font-medium">{weatherDay.description}</p>
                  <p className="text-gray-300">
                    {Math.round(weatherDay.temp_max)}° / {Math.round(weatherDay.temp_min)}°C
                  </p>
                  {weatherDay.pop > 10 && (
                    <p className="text-sky-400">💧 Rain: {weatherDay.pop}%</p>
                  )}
                  <p className="text-gray-400">
                    Humidity {weatherDay.humidity}% · Wind {Math.round(weatherDay.wind_speed * 3.6)} km/h
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceBadgeClass(source)}`}>
            {source}
          </span>
        </div>
      </div>
    </article>
    </>
  );
}
