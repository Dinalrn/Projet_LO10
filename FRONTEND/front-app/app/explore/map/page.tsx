"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import LocateButton from "@/components/LocateButton";
import { fetchEvents } from "@/lib/api";
import { Event, SourceStat } from "@/types/event";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function ExploreMapPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStat> | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [radius, setRadius] = useState(30);

  const handleSearch = async (query: string, radiusOverride?: number) => {
    const activeRadius = radiusOverride ?? radius;
    setLoading(true);
    setError(null);
    setSearched(true);
    setCity(query);
    setEvents([]);
    setSources(null);

    try {
      const data = await fetchEvents(query, activeRadius);
      setEvents(data.events ?? []);
      setSources(data.sources ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const mappedCount = useMemo(
    () => events.filter((e) => {
      const lat = parseFloat(e.location.lat);
      const lon = parseFloat(e.location.lon);
      return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;
    }).length,
    [events]
  );

  return (
    <div className="flex h-screen flex-col bg-[#0f0d1e]">

      {/* Top bar */}
      <header className="flex flex-col gap-2 px-4 py-3 border-b border-violet-900/40 bg-[#1a1730] shrink-0">

        {/* Row 1: brand · nav · search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xl font-extrabold tracking-tight text-white">
              Wanna<span className="text-violet-500">Go</span>
            </span>
            <nav className="flex gap-1 text-xs font-medium">
              <Link href="/explore"
                className="rounded-lg px-3 py-1.5 text-violet-300/60 hover:bg-violet-900/40 hover:text-white transition">
                List
              </Link>
              <span className="rounded-lg bg-violet-600 px-3 py-1.5 text-white">Map</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <SearchBar onSearch={handleSearch} loading={loading} radius={radius} onRadiusChange={setRadius} />
            <LocateButton onLocate={handleSearch} compact />
          </div>

          {/* Guest CTA */}
          <Link href="/login"
            className="shrink-0 ml-auto rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold
                       text-white hover:bg-violet-700 transition">
            Sign up / Log in
          </Link>
        </div>

        {/* Row 2: stats */}
        {searched && !loading && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400/60">
              Guest mode —
            </span>
            <span className="text-xs text-violet-300/60">
              <Link href="/login" className="underline hover:text-violet-300">sign up</Link> to save &amp; register events
            </span>
            <div className="ml-auto text-xs text-violet-300/60 shrink-0">
              {mappedCount} / {events.length} event{events.length !== 1 ? "s" : ""} on map
              {city && <span className="ml-1 font-semibold text-violet-200">· {city}</span>}
            </div>
          </div>
        )}
      </header>

      {/* Map area */}
      <div className="relative flex-1 overflow-hidden">
        <MapView events={events} savedEvents={[]} myRegistrations={[]} friendsEvents={[]} />

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-[#0f0d1e]/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-white">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span className="text-sm font-medium">Searching events…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="absolute inset-x-0 top-4 z-[999] mx-auto w-fit rounded-xl
                          border border-red-700 bg-red-950/90 px-5 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Empty state */}
        {searched && !loading && !error && events.length === 0 && (
          <div className="absolute inset-0 z-[998] flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl bg-[#1a1730]/90 px-8 py-6 text-center text-white backdrop-blur-sm border border-violet-900/40">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 font-semibold">No events found in &ldquo;{city}&rdquo;</p>
              <p className="mt-1 text-sm text-violet-300/60">Try a bigger city or different spelling.</p>
            </div>
          </div>
        )}

        {/* Initial hint */}
        {!searched && (
          <div className="absolute inset-0 z-[998] flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl bg-gray-900/70 px-8 py-6 text-center text-white backdrop-blur-sm">
              <p className="text-3xl">🗺️</p>
              <p className="mt-2 font-semibold">Search a city to explore events</p>
              <p className="mt-1 text-sm text-violet-300/60">
                <Link href="/login" className="underline pointer-events-auto hover:text-violet-300">
                  Create an account
                </Link>{" "}
                to unlock saving, registrations &amp; friends.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
