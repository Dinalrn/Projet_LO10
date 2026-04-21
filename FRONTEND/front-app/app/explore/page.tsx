"use client";

import { useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import EventList from "@/components/EventList";
import LocateButton from "@/components/LocateButton";
import WeatherWidget, { type WeatherData } from "@/components/WeatherWidget";
import { fetchEvents } from "@/lib/api";
import { Event, SourceStat } from "@/types/event";

export default function ExplorePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStat> | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [radius, setRadius] = useState(30);

  const handleSearch = async (query: string, radiusOverride?: number) => {
    const activeRadius = radiusOverride ?? radius;
    setLoading(true);
    setError(null);
    setSearched(true);
    setCity(query);
    setEvents([]);
    setSources(null);
    setWeather(null);

    try {
      const [evData, wxRes] = await Promise.allSettled([
        fetchEvents(query, activeRadius),
        fetch(`/api/weather?city=${encodeURIComponent(query)}`).then((r) => r.ok ? r.json() : null),
      ]);
      if (evData.status === "fulfilled") {
        setEvents(evData.value.events ?? []);
        setSources(evData.value.sources ?? null);
      } else {
        throw evData.reason;
      }
      if (wxRes.status === "fulfilled" && wxRes.value) {
        setWeather(wxRes.value as WeatherData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">

      {weather && !loading && (
        <div className="fixed top-4 z-40 w-full pointer-events-none">
          <div className="max-w-7xl mx-auto px-4">
            <div className="w-72 pointer-events-auto">
              <WeatherWidget city={city} data={weather} />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-16">

        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-violet-50">
            Wanna<span className="text-violet-600">Go</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-violet-300/70">
            Discover what&apos;s happening near you
          </p>
          <nav className="mt-4 flex justify-center gap-2 text-sm font-medium">
            <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-white">List</span>
            <Link href="/explore/map"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-violet-900/50 dark:text-violet-300/70 dark:hover:border-violet-500 dark:hover:text-violet-300">
              Map
            </Link>
          </nav>
        </header>

        {/* Guest banner */}
        <div className="mb-8 rounded-2xl border border-violet-300 bg-violet-50 px-5 py-4
                        flex flex-col sm:flex-row items-start sm:items-center gap-3
                        dark:border-violet-700/50 dark:bg-violet-950/40">
          <div className="flex-1 text-sm text-violet-800 dark:text-violet-200">
            <span className="font-semibold">You&apos;re browsing as a guest.</span>{" "}
            Create a free account to save events, register your attendance, share with friends and more.
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/login"
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white
                         hover:bg-violet-700 transition">
              Sign up / Log in
            </Link>
          </div>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} loading={loading} radius={radius} onRadiusChange={setRadius} />
        <div className="mt-3 flex justify-center">
          <LocateButton onLocate={handleSearch} />
        </div>

        {/* Source stats */}
        {sources && !loading && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Object.entries(sources).map(([name, stat]) => (
              <span key={name}
                className={`rounded-full px-3 py-1 text-xs font-medium border
                  ${stat.status === "ok"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                  }`}>
                {name}: {stat.count} events
              </span>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-violet-900/20" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-6 text-center
                          text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <p className="text-lg font-medium">Something went wrong</p>
            <p className="mt-1 text-sm opacity-75">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && searched && events.length === 0 && (
          <div className="mt-16 text-center text-gray-400 dark:text-violet-400/50">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 text-lg font-medium">No events found in &ldquo;{city}&rdquo;</p>
            <p className="mt-1 text-sm">Try a bigger city or a different spelling.</p>
          </div>
        )}

        {/* Results — action buttons omitted for guests */}
        {!loading && events.length > 0 && (
          <section className="mt-10">
            <p className="mb-4 text-sm text-gray-400 dark:text-violet-400/60">
              {events.length} event{events.length > 1 ? "s" : ""} found in{" "}
              <span className="font-semibold text-gray-700 dark:text-violet-200">{city}</span>
              <span className="ml-2 text-violet-500 text-xs">
                — <Link href="/login" className="underline hover:text-violet-300">sign up</Link> to save &amp; register
              </span>
            </p>
            <EventList
              events={events}
              savedIds={new Set()}
              registeredIds={new Set()}
            />
          </section>
        )}

      </div>
    </main>
  );
}
