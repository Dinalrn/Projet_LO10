"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import UserMenu from "@/components/UserMenu";
import { fetchEvents } from "@/lib/api";
import { saveSearch, loadSearch } from "@/lib/search-store";
import { Event, Registration, FriendEventLayer, SourceStat } from "@/types/event";
import { MapLegend } from "@/components/MapLegend";
import { OVERLAY_COLORS } from "@/components/MapView";
import LocateButton from "@/components/LocateButton";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function MapPage() {
  /* ── Search results ── */
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStat> | null>(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  /* ── Auth ── */
  const [username, setUsername] = useState<string | null>(null);

  /* ── Personal overlay data ── */
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [friendsEvents, setFriendsEvents] = useState<FriendEventLayer[]>([]);

  /* ── Radius ── */
  const [radius, setRadius] = useState(30);

  /* ── Toggle state ── */
  const [showSaved, setShowSaved] = useState(false);
  const [showRegistered, setShowRegistered] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);

    fetch("/api/saved-events")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.events)) setSavedEvents(d.events); })
      .catch(() => null);

    fetch("/api/registrations")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.registrations)) setMyRegistrations(d.registrations); })
      .catch(() => null);

    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => {
        const layers: FriendEventLayer[] = [];
        for (const friend of (d.friends ?? [])) {
          for (const reg of (friend.going ?? [])) {
            layers.push({
              event: reg.event_data as Event,
              friend_username: friend.friend_username,
              visit_date: reg.visit_date,
              visit_time: reg.visit_time,
            });
          }
        }
        setFriendsEvents(layers);
      })
      .catch(() => null);

    // Restore last search from localStorage
    const last = loadSearch();
    if (last) {
      setRadius(last.radius);
      handleSearch(last.city, last.radius);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (query: string, radiusOverride?: number) => {
    const activeRadius = radiusOverride ?? radius;
    setLoading(true);
    setError(null);
    setSearched(true);
    setCity(query);
    setEvents([]);
    setSources(null);

    saveSearch(query, activeRadius);

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

  const sourceNames = useMemo(() => [...new Set(events.map((e) => e.source))], [events]);

  const mappedCount = useMemo(
    () => events.filter((e) => {
      const lat = parseFloat(e.location.lat);
      const lon = parseFloat(e.location.lon);
      return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;
    }).length,
    [events]
  );

  /* ── Toggle button helper ── */
  function ToggleBtn({
    active, onToggle, color, label, count,
  }: { active: boolean; onToggle: () => void; color: string; label: string; count: number }) {
    return (
      <button
        onClick={onToggle}
        disabled={count === 0}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium
                   transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={active
          ? { backgroundColor: color, color: "#fff" }
          : { border: `1.5px solid ${color}`, color }}
      >
        {label}
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold
                          ${active ? "bg-white/25" : "bg-gray-900/10"}`}>
          {count}
        </span>
      </button>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950">

      {/* ── Top bar ── */}
      <header className="flex flex-col gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">

        {/* Row 1: brand · nav · search · user · stats */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xl font-extrabold tracking-tight text-white">
              Wanna<span className="text-violet-500">Go</span>
            </span>
            <nav className="flex gap-1 text-xs font-medium">
              <Link href="/pages"
                className="rounded-lg px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition">
                List
              </Link>
              <span className="rounded-lg bg-violet-600 px-3 py-1.5 text-white">Map</span>
              <Link href="/saved"
                className="rounded-lg px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition">
                Saved
              </Link>
              <Link href="/registered"
                className="rounded-lg px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition">
                Going
              </Link>
              <Link href="/friends"
                className="rounded-lg px-3 py-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition">
                Friends
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <SearchBar onSearch={handleSearch} loading={loading} radius={radius} onRadiusChange={setRadius} />
            <LocateButton onLocate={handleSearch} compact />
          </div>

          {username && <div className="shrink-0"><UserMenu username={username} /></div>}

          {searched && !loading && (
            <div className="text-xs text-gray-400 shrink-0">
              {mappedCount} / {events.length} event{events.length !== 1 ? "s" : ""} on map
              {city && <span className="ml-1 font-semibold text-gray-300">· {city}</span>}
            </div>
          )}
        </div>

        {/* Row 2: overlay toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mr-1">
            Show:
          </span>
          <ToggleBtn
            active={showSaved}
            onToggle={() => setShowSaved((v) => !v)}
            color={OVERLAY_COLORS.saved}
            label="📌 My saved"
            count={savedEvents.length}
          />
          <ToggleBtn
            active={showRegistered}
            onToggle={() => setShowRegistered((v) => !v)}
            color={OVERLAY_COLORS.registered}
            label="📅 My going"
            count={myRegistrations.length}
          />
          <ToggleBtn
            active={showFriends}
            onToggle={() => setShowFriends((v) => !v)}
            color={OVERLAY_COLORS.friends}
            label="👥 Friends going"
            count={friendsEvents.length}
          />
        </div>
      </header>

      {/* ── Map area ── */}
      <div className="relative flex-1 overflow-hidden">
        <MapView
          events={events}
          savedEvents={showSaved ? savedEvents : []}
          myRegistrations={showRegistered ? myRegistrations : []}
          friendsEvents={showFriends ? friendsEvents : []}
        />

        <MapLegend
          sources={sourceNames}
          showSaved={showSaved && savedEvents.length > 0}
          showRegistered={showRegistered && myRegistrations.length > 0}
          showFriends={showFriends && friendsEvents.length > 0}
        />

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center
                          bg-gray-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-white">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth={2}>
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
        {searched && !loading && !error && mappedCount === 0 && events.length === 0 && (
          <div className="absolute inset-0 z-[998] flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl bg-gray-900/80 px-8 py-6 text-center text-white backdrop-blur-sm">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 font-semibold">No events found in &ldquo;{city}&rdquo;</p>
              <p className="mt-1 text-sm text-gray-400">Try a bigger city or different spelling.</p>
            </div>
          </div>
        )}

        {/* Some without coords */}
        {searched && !loading && events.length > 0 && mappedCount < events.length && (
          <div className="absolute bottom-6 left-4 z-[1000] rounded-lg border border-gray-700
                          bg-gray-900/80 px-3 py-1.5 text-xs text-gray-400 backdrop-blur-sm">
            {events.length - mappedCount} event{events.length - mappedCount !== 1 ? "s" : ""} without location hidden
          </div>
        )}

        {/* Initial hint */}
        {!searched && !showSaved && !showRegistered && !showFriends && (
          <div className="absolute inset-0 z-[998] flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl bg-gray-900/70 px-8 py-6 text-center text-white backdrop-blur-sm">
              <p className="text-3xl">🗺️</p>
              <p className="mt-2 font-semibold">Search a city or toggle a layer above</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
