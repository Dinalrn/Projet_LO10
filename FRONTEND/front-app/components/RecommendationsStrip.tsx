"use client";

import { useState, useEffect } from "react";
import { Event } from "@/types/event";
import type { RecommendedEvent } from "@/app/api/recommendations/route";

interface Props {
  city: string;
  radiusKm: number;
  savedIds: Set<string>;
  registeredIds: Set<string>;
  onToggleSave: (event: Event) => Promise<void>;
  onRegister: (event: Event) => void;
  onShare: (event: Event) => void;
}

const REASON_COLORS: Record<string, string> = {
  "Your taste":    "bg-violet-600 text-white",
  "This week":     "bg-amber-500 text-white",
  "This month":    "bg-amber-700 text-white",
  "Saved":         "bg-sky-600 text-white",
  "Past interest": "bg-teal-600 text-white",
};
function reasonColor(r: string) {
  if (r.includes("friend")) return "bg-pink-600 text-white";
  return REASON_COLORS[r] ?? "bg-gray-600 text-white";
}

export default function RecommendationsStrip({
  city, radiusKm, savedIds, registeredIds, onToggleSave, onRegister, onShare,
}: Props) {
  const [recs, setRecs] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setRecs([]);
    fetch(`/api/recommendations?city=${encodeURIComponent(city)}&radius_km=${radiusKm}`)
      .then((r) => r.json())
      .then((d) => setRecs(d.recommendations ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [city, radiusKm]);

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-500">
          For You
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 w-52 shrink-0 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (recs.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-500">
        For You · {recs.length} picks
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recs.map((event) => (
          <RecoCard
            key={event.id}
            event={event}
            isSaved={savedIds.has(event.id)}
            isRegistered={registeredIds.has(event.id)}
            onToggleSave={onToggleSave}
            onRegister={onRegister}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
}

function RecoCard({
  event, isSaved, isRegistered, onToggleSave, onRegister, onShare,
}: {
  event: RecommendedEvent;
  isSaved: boolean;
  isRegistered: boolean;
  onToggleSave: (e: Event) => Promise<void>;
  onRegister: (e: Event) => void;
  onShare: (e: Event) => void;
}) {
  return (
    <article className="relative flex w-52 shrink-0 flex-col overflow-hidden rounded-2xl
                        border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Image */}
      <div className="relative h-28 w-full bg-gray-100 dark:bg-gray-800">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt={event.title} className="h-full w-full object-cover"
               onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-gray-300 dark:text-gray-600">🎭</div>
        )}

        {/* Action buttons */}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <button onClick={() => onToggleSave(event)}
            className="rounded-full bg-black/60 p-1 backdrop-blur-sm hover:bg-black/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5"
                 fill={isSaved ? "white" : "none"} stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button onClick={() => onRegister(event)}
            className={`rounded-full p-1 backdrop-blur-sm hover:bg-black/80 ${isRegistered ? "bg-violet-600/90" : "bg-black/60"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5"
                 fill="none" stroke="white" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
              <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
              {isRegistered && <path strokeLinecap="round" strokeLinejoin="round" d="M8 14l2.5 2.5L16 13" />}
            </svg>
          </button>
          <button onClick={() => onShare(event)}
            className="rounded-full bg-black/60 p-1 backdrop-blur-sm hover:bg-black/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5"
                 fill="none" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-900 dark:text-white">
          {event.title || "Untitled event"}
        </p>
        {event.date && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            📅 {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </p>
        )}
        {/* Reason badges */}
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {event.reasons.map((r) => (
            <span key={r} className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${reasonColor(r)}`}>
              {r}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
