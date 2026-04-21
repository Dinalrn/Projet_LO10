"use client";

import { useEffect, useState } from "react";
import { Event } from "@/types/event";

interface Props {
  event: Event;
  isSaved: boolean;
  isRegistered: boolean;
  onToggleSave?: (event: Event) => Promise<void>;
  onRegister?: (event: Event) => void;
  onShare?: (event: Event) => void;
  onClose: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  ticketmaster:          "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  datatourisme:          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  openagenda:            "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "data.culture.gouv.fr":"bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
};
function sourceBadgeClass(source: string) {
  return SOURCE_COLORS[source] ?? "bg-gray-100 text-gray-600 dark:bg-violet-900/40 dark:text-violet-300";
}

function formatFullDate(date: string, time: string): string {
  if (!date) return "Date TBD";
  try {
    const d = new Date(`${date}T${time || "00:00"}`);
    const datePart = d.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    return time ? `${datePart} · ${time.slice(0, 5)}` : datePart;
  } catch {
    return date;
  }
}

function mapsUrl(lat: string, lon: string, fallback: string): string {
  if (lat && lon && lat !== "0" && lon !== "0") {
    return `https://www.google.com/maps?q=${lat},${lon}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(fallback)}`;
}

export default function EventDetailModal({
  event, isSaved, isRegistered, onToggleSave, onRegister, onShare, onClose,
}: Props) {
  const { title, description, category, date, time, location, price, image, source } = event;
  const [saving, setSaving] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSave = async () => {
    if (!onToggleSave) return;
    setSaving(true);
    try { await onToggleSave(event); } finally { setSaving(false); }
  };

  const addressParts = [location.name, location.city].filter(Boolean);
  const mapsLink = mapsUrl(location.lat, location.lon, addressParts.join(", "));
  const hasCoords = location.lat && location.lon && location.lat !== "0" && location.lon !== "0";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl
                   bg-white dark:bg-[#1a1730] shadow-2xl shadow-violet-950/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Hero image ── */}
        <div className="relative h-64 w-full shrink-0 bg-gray-100 dark:bg-violet-950/60">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover rounded-t-3xl"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl text-gray-300 dark:text-violet-800/50 rounded-t-3xl">
              🎭
            </div>
          )}

          {/* Gradient overlay so text on image is readable */}
          <div className="absolute inset-0 rounded-t-3xl bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Category pill on image */}
          {category && (
            <span className="absolute bottom-3 left-4 rounded-full bg-black/60 px-3 py-1
                             text-xs font-semibold text-white backdrop-blur-sm">
              {category}
            </span>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/60 p-2
                       text-white backdrop-blur-sm hover:bg-black/80 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5"
                 fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col gap-5 p-6">

          {/* Title + source badge */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-snug text-gray-900 dark:text-violet-50">
              {title || "Untitled event"}
            </h2>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${sourceBadgeClass(source)}`}>
              {source}
            </span>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm leading-relaxed text-gray-600 dark:text-violet-200/70 whitespace-pre-line">
              {description}
            </p>
          )}

          {/* ── Info grid ── */}
          <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 dark:border-violet-800/30
                          bg-violet-50/50 dark:bg-violet-950/40 p-4 text-sm">

            {/* Date */}
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">📅</span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-violet-400/60 mb-0.5">
                  Date
                </p>
                <p className="font-medium text-gray-800 dark:text-violet-100 capitalize">
                  {formatFullDate(date, time)}
                </p>
              </div>
            </div>

            {/* Location */}
            {addressParts.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">📍</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-violet-400/60 mb-0.5">
                    Location
                  </p>
                  {location.name && (
                    <p className="font-medium text-gray-800 dark:text-violet-100">{location.name}</p>
                  )}
                  {location.city && (
                    <p className="text-gray-600 dark:text-violet-300/70">{location.city}</p>
                  )}
                  {hasCoords && (
                    <p className="text-[11px] text-gray-400 dark:text-violet-400/60 mt-0.5">
                      {parseFloat(location.lat).toFixed(5)}°N, {parseFloat(location.lon).toFixed(5)}°E
                    </p>
                  )}
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-600
                               hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition"
                  >
                    Open in Google Maps
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3 w-3"
                         fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">🎟️</span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-violet-400/60 mb-0.5">
                  Price
                </p>
                <p className="font-medium text-gray-800 dark:text-violet-100">
                  {price > 0 ? `${price} €` : "Free admission"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex flex-wrap gap-2 pt-1">
            {onToggleSave && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
                            transition disabled:opacity-50
                            ${isSaved
                              ? "bg-violet-600 text-white hover:bg-violet-700"
                              : "border border-gray-200 dark:border-violet-800/50 text-gray-700 dark:text-violet-300 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-300"
                            }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"
                     fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isSaved ? "Saved" : "Save"}
              </button>
            )}
            {onRegister && (
              <button
                onClick={() => { onRegister(event); onClose(); }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition
                            ${isRegistered
                              ? "bg-violet-600 text-white hover:bg-violet-700"
                              : "border border-gray-200 dark:border-violet-800/50 text-gray-700 dark:text-violet-300 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-300"
                            }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"
                     fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
                  <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                  <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
                  {isRegistered && <path strokeLinecap="round" strokeLinejoin="round" d="M8 14l2.5 2.5L16 13" />}
                </svg>
                {isRegistered ? "Going" : "I'm going"}
              </button>
            )}
            {onShare && (
              <button
                onClick={() => { onShare(event); onClose(); }}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-violet-800/50
                           px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-violet-300
                           hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500
                           dark:hover:text-violet-400 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"
                     fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
                Send to a friend
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
