"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import EventCard from "@/components/EventCard";
import { Event } from "@/types/event";

export default function SavedEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);

    fetch("/api/saved-events")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.events)) {
          setEvents(d.events);
          setSavedIds(new Set(d.events.map((e: Event) => e.id)));
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleSave = useCallback(async (event: Event) => {
    // On this page, toggling always means unsaving
    await fetch(`/api/saved-events/${encodeURIComponent(event.id)}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(event.id);
      return next;
    });
  }, []);

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
            Your saved events
          </p>
          <nav className="mt-4 flex justify-center gap-2 text-sm font-medium">
            <Link
              href="/pages"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500
                         dark:hover:text-violet-400"
            >
              List
            </Link>
            <Link
              href="/map"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500
                         dark:hover:text-violet-400"
            >
              Map
            </Link>
            <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-white">
              Saved
            </span>
            <Link
              href="/registered"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500
                         dark:hover:text-violet-400"
            >
              Going
            </Link>
          </nav>
        </header>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
              />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && events.length === 0 && (
          <div className="mt-16 text-center text-gray-400 dark:text-gray-600">
            <p className="text-4xl">🔖</p>
            <p className="mt-3 text-lg font-medium">No saved events yet</p>
            <p className="mt-1 text-sm">
              Browse events and click the bookmark icon to save them here.
            </p>
            <Link
              href="/pages"
              className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2 text-sm
                         font-medium text-white hover:bg-violet-700 transition"
            >
              Discover events
            </Link>
          </div>
        )}

        {/* ── Saved events grid ── */}
        {!loading && events.length > 0 && (
          <section>
            <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
              {events.length} saved event{events.length > 1 ? "s" : ""}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSaved={savedIds.has(event.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
