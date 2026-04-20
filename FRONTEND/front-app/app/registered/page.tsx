"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { Event, Registration } from "@/types/event";

function formatVisitDate(date: string, time: string | null): string {
  try {
    const d = new Date(`${date}T${time || "00:00"}`);
    const formatted = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return time ? `${formatted} · ${time}` : formatted;
  } catch {
    return date;
  }
}

export default function RegisteredPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);

    fetch("/api/registrations")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.registrations)) setRegistrations(d.registrations);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleUnregister = useCallback(async (event: Event) => {
    await fetch(`/api/registrations/${encodeURIComponent(event.id)}`, { method: "DELETE" });
    setRegistrations((prev) => prev.filter((r) => r.event_data.id !== event.id));
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
            Events you&apos;re going to
          </p>
          <nav className="mt-4 flex justify-center gap-2 text-sm font-medium">
            <Link href="/pages" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              List
            </Link>
            <Link href="/map" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              Map
            </Link>
            <Link href="/saved" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              Saved
            </Link>
            <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-white">Going</span>
            <Link href="/friends" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              Friends
            </Link>
            <Link href="/preferences" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              ★ Preferences
            </Link>
          </nav>
        </header>

        {/* ── Loading ── */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && registrations.length === 0 && (
          <div className="mt-16 text-center text-gray-400 dark:text-gray-600">
            <p className="text-4xl">📅</p>
            <p className="mt-3 text-lg font-medium">No upcoming registrations</p>
            <p className="mt-1 text-sm">Find an event and click the calendar icon to register.</p>
            <Link
              href="/pages"
              className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2 text-sm
                         font-medium text-white hover:bg-violet-700 transition"
            >
              Discover events
            </Link>
          </div>
        )}

        {/* ── Registration cards ── */}
        {!loading && registrations.length > 0 && (
          <section>
            <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
              {registrations.length} upcoming event{registrations.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-4">
              {registrations.map((reg) => {
                const ev = reg.event_data;
                return (
                  <article
                    key={ev.id}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4
                               shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    {/* Thumbnail */}
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                      {ev.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ev.image}
                          alt={ev.title}
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl text-gray-300 dark:text-gray-600">
                          🎭
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{ev.source} · {ev.category}</p>
                        <h2 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{ev.title}</h2>
                        {(ev.location.city || ev.location.name) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            📍 {[ev.location.name, ev.location.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Visit date badge */}
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1
                                      text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300 w-fit">
                        <span>📅</span>
                        <span>{formatVisitDate(reg.visit_date, reg.visit_time)}</span>
                      </div>
                    </div>

                    {/* Unregister */}
                    <div className="shrink-0 flex items-start">
                      <button
                        onClick={() => handleUnregister(ev)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium
                                   text-gray-500 hover:border-red-300 hover:text-red-500 transition
                                   dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-700 dark:hover:text-red-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
