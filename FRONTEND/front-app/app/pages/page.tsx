"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import EventList from "@/components/EventList";
import UserMenu from "@/components/UserMenu";
import RegisterModal from "@/components/RegisterModal";
import ShareEventModal from "@/components/ShareEventModal";
import LocateButton from "@/components/LocateButton";
import WeatherWidget, { type WeatherData } from "@/components/WeatherWidget";
import { fetchEvents } from "@/lib/api";
import { Event, Registration, SourceStat } from "@/types/event";

interface FriendOption { friend_id: string; friend_username: string; }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStat> | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [registeringEvent, setRegisteringEvent] = useState<Event | null>(null);
  const [pendingFriends, setPendingFriends] = useState(0);
  const [friendsList, setFriendsList] = useState<FriendOption[]>([]);
  const [sharingEvent, setSharingEvent] = useState<Event | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [radius, setRadius] = useState(30);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);

    fetch("/api/saved-events")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.events)) {
          setSavedIds(new Set(d.events.map((e: Event) => e.id)));
        }
      })
      .catch(() => null);

    fetch("/api/registrations")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.registrations)) {
          setRegisteredIds(new Set(d.registrations.map((r: Registration) => r.event_data.id)));
        }
      })
      .catch(() => null);

    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => {
        setPendingFriends((d.pending_received?.length ?? 0) + (d.unread_shared ?? 0));
        setFriendsList(d.friends ?? []);
      })
      .catch(() => null);
  }, []);

  const handleToggleSave = useCallback(async (event: Event) => {
    const isSaved = savedIds.has(event.id);
    if (isSaved) {
      await fetch(`/api/saved-events/${encodeURIComponent(event.id)}`, { method: "DELETE" });
      setSavedIds((prev) => { const n = new Set(prev); n.delete(event.id); return n; });
    } else {
      await fetch("/api/saved-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      setSavedIds((prev) => new Set(prev).add(event.id));
    }
  }, [savedIds]);

  const handleConfirmShare = useCallback(async (recipientId: string, message: string) => {
    if (!sharingEvent) return;
    await fetch("/api/shared-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: sharingEvent, recipient_id: recipientId, message }),
    });
    setSharingEvent(null);
  }, [sharingEvent]);

  const handleConfirmRegister = useCallback(async (visitDate: string, visitTime: string) => {
    if (!registeringEvent) return;
    await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: registeringEvent, visit_date: visitDate, visit_time: visitTime || null }),
    });
    setRegisteredIds((prev) => new Set(prev).add(registeringEvent.id));
    setRegisteringEvent(null);
  }, [registeringEvent]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setCity(query);
    setEvents([]);
    setSources(null);
    setWeather(null);

    try {
      const [evData, wxRes] = await Promise.allSettled([
        fetchEvents(query, radius),
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {registeringEvent && (
        <RegisterModal
          event={registeringEvent}
          onConfirm={handleConfirmRegister}
          onClose={() => setRegisteringEvent(null)}
        />
      )}
      {sharingEvent && (
        <ShareEventModal
          event={sharingEvent}
          friends={friendsList}
          onConfirm={handleConfirmShare}
          onClose={() => setSharingEvent(null)}
        />
      )}

      {/* ── Weather panel – fixed, aligned to main layout left edge ── */}
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
            <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-white">List</span>
            <Link href="/map" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              Map
            </Link>
            <Link href="/saved" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              Saved{savedIds.size > 0 && ` (${savedIds.size})`}
            </Link>
            <Link href="/registered" className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              Going{registeredIds.size > 0 && ` (${registeredIds.size})`}
            </Link>
            <Link href="/friends" className="relative rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                       hover:border-violet-400 hover:text-violet-600 transition
                       dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400">
              Friends
              {pendingFriends > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center
                                 rounded-full bg-violet-600 text-[10px] font-bold text-white">
                  {pendingFriends}
                </span>
              )}
            </Link>
          </nav>
        </header>

        {/* ── Search ── */}
        <SearchBar onSearch={handleSearch} loading={loading} radius={radius} onRadiusChange={setRadius} />
        <div className="mt-3 flex justify-center">
          <LocateButton onLocate={handleSearch} />
        </div>

        {/* ── Source stats ── */}
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
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
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
            <EventList
              events={events}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              registeredIds={registeredIds}
              onRegister={setRegisteringEvent}
              onShare={setSharingEvent}
            />
          </section>
        )}

      </div>
    </main>
  );
}
