"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import EventList from "@/components/EventList";
import UserMenu from "@/components/UserMenu";
import { fetchEvents } from "@/lib/api";
import { Event, SourceStat } from "@/types/event";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStat> | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);
  }, []);

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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-16">

        {/* ── Header ── */}
        <header className="mb-12 text-center">
          <div className="flex justify-end mb-2">
            {username && <UserMenu username={username} />}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Wanna<span className="text-violet-600">Go</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            Discover what&apos;s happening near you
          </p>
          <nav className="mt-4 flex justify-center gap-2 text-sm font-medium">
            <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-white">
              List
            </span>
            <Link
              href="/map"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500
                         dark:hover:text-violet-400"
            >
              Map
            </Link>
          </nav>
        </header>

        {/* ── Search ── */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* ── Source stats (after search) ── */}
        {sources && !loading && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Object.entries(sources).map(([name, stat]) => (
              <span
                key={name}
                className={`rounded-full px-3 py-1 text-xs font-medium border
                  ${stat.status === "ok"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                  }`}
              >
                {name}: {stat.count} events
              </span>
            ))}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
              />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-6 text-center
                          text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <p className="text-lg font-medium">Something went wrong</p>
            <p className="mt-1 text-sm opacity-75">{error}</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && searched && events.length === 0 && (
          <div className="mt-16 text-center text-gray-400 dark:text-gray-600">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 text-lg font-medium">No events found in &ldquo;{city}&rdquo;</p>
            <p className="mt-1 text-sm">Try a bigger city or a different spelling.</p>
          </div>
        )}

        {/* ── Results ── */}
        {!loading && events.length > 0 && (
          <section className="mt-10">
            <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
              {events.length} event{events.length > 1 ? "s" : ""} found in{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{city}</span>
            </p>
            <EventList events={events} />
          </section>
        )}

      </div>
    </main>
  );
}
