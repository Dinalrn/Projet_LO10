"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import UserMenu from "@/components/UserMenu";
import { fetchEvents } from "@/lib/api";
import { Event, SourceStat } from "@/types/event";
import { MapLegend } from "@/components/MapView";

/* Leaflet must not run on the server */
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function MapPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);
  }, []);
  const [sources, setSources] = useState<Record<string, SourceStat> | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setCity(query);
    setEvents([]);
    setSources(null);

    try {
      const data = await fetchEvents(query);
      setEvents(data.events ?? []);
      setSources(data.sources ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* List of source names present in current results */
  const sourceNames = useMemo(
    () => [...new Set(events.map((e) => e.source))],
    [events]
  );

  /* Count events that have valid coordinates */
  const mappedCount = useMemo(
    () =>
      events.filter((e) => {
        const lat = parseFloat(e.location.lat);
        const lon = parseFloat(e.location.lon);
        return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;
      }).length,
    [events]
  );

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      {/* ── Top bar ────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center
                         border-b border-gray-800 bg-gray-900 shrink-0">
        {/* Brand + nav */}
        <div className="flex items-center gap-4">
          <span className="text-xl font-extrabold tracking-tight text-white">
            Wanna<span className="text-violet-500">Go</span>
          </span>
          <nav className="flex gap-2 text-xs font-medium">
            <Link
              href="/pages"
              className="rounded-lg px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              List
            </Link>
            <span className="rounded-lg bg-violet-600 px-3 py-1.5 text-white">
              Map
            </span>
          </nav>
        </div>

        {/* Search bar */}
        <div className="flex-1 sm:max-w-md">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {/* User menu */}
        {username && (
          <div className="shrink-0">
            <UserMenu username={username} />
          </div>
        )}

        {/* Stats chip */}
        {searched && !loading && (
          <div className="text-xs text-gray-400 shrink-0">
            {mappedCount} / {events.length} event{events.length !== 1 ? "s" : ""} on map
            {city && (
              <span className="ml-1 font-semibold text-gray-300">· {city}</span>
            )}
          </div>
        )}
      </header>

      {/* ── Map area ───────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map */}
        <MapView events={events} />

        {/* Source legend (absolute, bottom-right) */}
        {sourceNames.length > 0 && <MapLegend sources={sourceNames} />}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center
                          bg-gray-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-white">
              <svg
                className="h-8 w-8 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span className="text-sm font-medium">Searching events…</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <div className="absolute inset-x-0 top-4 z-[999] mx-auto w-fit rounded-xl
                          border border-red-700 bg-red-950/90 px-5 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Empty state (after search, no results with coords) */}
        {searched && !loading && !error && mappedCount === 0 && events.length === 0 && (
          <div className="absolute inset-0 z-[998] flex items-center justify-center
                          pointer-events-none">
            <div className="rounded-2xl bg-gray-900/80 px-8 py-6 text-center text-white backdrop-blur-sm">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 font-semibold">No events found in &ldquo;{city}&rdquo;</p>
              <p className="mt-1 text-sm text-gray-400">Try a bigger city or different spelling.</p>
            </div>
          </div>
        )}

        {/* "Some events without coords" hint */}
        {searched && !loading && events.length > 0 && mappedCount < events.length && (
          <div className="absolute bottom-6 left-4 z-[1000] rounded-lg border border-gray-700
                          bg-gray-900/80 px-3 py-1.5 text-xs text-gray-400 backdrop-blur-sm">
            {events.length - mappedCount} event{events.length - mappedCount !== 1 ? "s" : ""} without location hidden
          </div>
        )}

        {/* Initial state hint */}
        {!searched && (
          <div className="absolute inset-0 z-[998] flex items-center justify-center
                          pointer-events-none">
            <div className="rounded-2xl bg-gray-900/70 px-8 py-6 text-center text-white backdrop-blur-sm">
              <p className="text-3xl">🗺️</p>
              <p className="mt-2 font-semibold">Search a city to see events on the map</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
