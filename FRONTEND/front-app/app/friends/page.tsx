"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { Registration, Event } from "@/types/event";

/* ── Types ────────────────────────────────────────────────── */
interface FriendEntry {
  friendship_id: string;
  friend_id: string;
  friend_username: string;
  friend_avatar: string | null;
  going: Registration[];
}

interface PendingReceived {
  id: string;
  requester_id: string;
  requester_username: string;
}

interface PendingSent {
  id: string;
  addressee_id: string;
  addressee_username: string;
}

interface FriendsData {
  friends: FriendEntry[];
  pending_received: PendingReceived[];
  pending_sent: PendingSent[];
}

interface SharedItem {
  id: string;
  sender_username?: string;
  recipient_username?: string;
  event_data: Event;
  message: string | null;
  sent_at: string;
  unread: boolean;
}

interface SharedEvents {
  received: SharedItem[];
  sent: SharedItem[];
}

/* ── Helpers ──────────────────────────────────────────────── */
function formatVisitDate(date: string, time: string | null): string {
  try {
    const d = new Date(`${date}T${time || "00:00"}`);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }) + (time ? ` · ${time}` : "");
  } catch {
    return date;
  }
}

/* ── Page ─────────────────────────────────────────────────── */
export default function FriendsPage() {
  const [data, setData] = useState<FriendsData>({
    friends: [],
    pending_received: [],
    pending_sent: [],
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const [shared, setShared] = useState<SharedEvents>({ received: [], sent: [] });

  // Add-friend form state
  const [searchInput, setSearchInput] = useState("");
  const [requestStatus, setRequestStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (res.ok) setData(await res.json());
  }, []);

  const loadShared = useCallback(async () => {
    const res = await fetch("/api/shared-events");
    if (!res.ok) return;
    const d: SharedEvents = await res.json();
    setShared(d);
    // Mark all unread as read silently in background
    d.received.filter((item) => item.unread).forEach((item) => {
      fetch(`/api/shared-events/${item.id}`, { method: "PATCH" }).catch(() => null);
    });
    // Update local state to reflect read status
    setShared({ ...d, received: d.received.map((i) => ({ ...i, unread: false })) });
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);

    Promise.all([loadData(), loadShared()]).finally(() => setLoading(false));
  }, [loadData, loadShared]);

  /* ── Send friend request ── */
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSending(true);
    setRequestStatus(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: searchInput.trim() }),
    });
    const json = await res.json();
    if (res.ok) {
      setRequestStatus({ type: "ok", msg: `Friend request sent to ${searchInput.trim()}!` });
      setSearchInput("");
      await loadData();
    } else {
      setRequestStatus({ type: "err", msg: json.error ?? "Something went wrong" });
    }
    setSending(false);
  };

  /* ── Delete a shared event item ── */
  const handleDeleteShared = async (id: string) => {
    await fetch(`/api/shared-events/${id}`, { method: "DELETE" });
    setShared((prev) => ({
      received: prev.received.filter((i) => i.id !== id),
      sent: prev.sent.filter((i) => i.id !== id),
    }));
  };

  /* ── Accept / decline request ── */
  const handleRespond = async (id: string, action: "accept" | "decline") => {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadData();
  };

  /* ── Cancel sent request or remove friend ── */
  const handleRemove = async (id: string) => {
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    await loadData();
  };

  const navLink = "rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400";

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-16">

        {/* ── Header ── */}
        <header className="mb-12 text-center">
          <div className="flex justify-end mb-2">
            {username && <UserMenu username={username} />}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Wanna<span className="text-violet-600">Go</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">Your friends</p>
          <nav className="mt-4 flex justify-center gap-2 text-sm font-medium flex-wrap">
            <Link href="/pages" className={navLink}>List</Link>
            <Link href="/map" className={navLink}>Map</Link>
            <Link href="/saved" className={navLink}>Saved</Link>
            <Link href="/registered" className={navLink}>Going</Link>
            <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-white">Friends</span>
            <Link href="/preferences" className={navLink}>★ Preferences</Link>
          </nav>
        </header>

        {/* ── Add friend ── */}
        <section className="mb-8">
          <form onSubmit={handleSendRequest} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by username…"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setRequestStatus(null); }}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm
                         text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:outline-none
                         dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500
                         dark:focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={sending || !searchInput.trim()}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white
                         hover:bg-violet-700 transition disabled:opacity-50"
            >
              {sending ? "…" : "Add"}
            </button>
          </form>
          {requestStatus && (
            <p className={`mt-2 text-sm ${requestStatus.type === "ok" ? "text-green-500" : "text-red-500"}`}>
              {requestStatus.msg}
            </p>
          )}
        </section>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── Pending received ── */}
            {data.pending_received.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-500">
                  Friend requests · {data.pending_received.length}
                </h2>
                <div className="space-y-2">
                  {data.pending_received.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-2xl border border-violet-200
                                 bg-violet-50 px-4 py-3 dark:border-violet-800 dark:bg-violet-950/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full
                                        bg-violet-200 text-sm font-bold text-violet-700
                                        dark:bg-violet-800 dark:text-violet-200">
                          {req.requester_username[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {req.requester_username}
                        </span>
                        <span className="text-xs text-gray-400">wants to be your friend</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(req.id, "accept")}
                          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium
                                     text-white hover:bg-violet-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, "decline")}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium
                                     text-gray-600 hover:border-red-400 hover:text-red-500 transition
                                     dark:border-gray-600 dark:text-gray-400"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Pending sent ── */}
            {data.pending_sent.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  Sent requests
                </h2>
                <div className="space-y-2">
                  {data.pending_sent.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100
                                 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full
                                        bg-gray-100 text-sm font-bold text-gray-500
                                        dark:bg-gray-800 dark:text-gray-400">
                          {req.addressee_username[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {req.addressee_username}
                        </span>
                        <span className="text-xs text-gray-400">pending…</span>
                      </div>
                      <button
                        onClick={() => handleRemove(req.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium
                                   text-gray-500 hover:border-red-400 hover:text-red-500 transition
                                   dark:border-gray-700 dark:text-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Friends list ── */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
                Friends · {data.friends.length}
              </h2>

              {data.friends.length === 0 && data.pending_received.length === 0 && data.pending_sent.length === 0 && (
                <div className="mt-8 text-center text-gray-400 dark:text-gray-600">
                  <p className="text-4xl">👥</p>
                  <p className="mt-3 font-medium">No friends yet</p>
                  <p className="mt-1 text-sm">Search for a username above to send a request.</p>
                </div>
              )}

              <div className="space-y-3">
                {data.friends.map((f) => (
                  <div
                    key={f.friendship_id}
                    className="rounded-2xl border border-gray-100 bg-white p-4
                               dark:border-gray-800 dark:bg-gray-900"
                  >
                    {/* Friend header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full
                                        bg-violet-100 text-sm font-bold text-violet-700
                                        dark:bg-violet-900 dark:text-violet-300">
                          {f.friend_username[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {f.friend_username}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemove(f.friendship_id)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-400
                                   hover:border-red-400 hover:text-red-500 transition
                                   dark:border-gray-700"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Going events */}
                    {f.going.length > 0 ? (
                      <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <p className="text-xs font-medium text-gray-400 mb-2">Going to…</p>
                        {f.going.map((reg, i) => {
                          const ev = reg.event_data as { title?: string; location?: { city?: string; name?: string }; source?: string };
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50
                                               px-2.5 py-1 text-xs font-medium text-violet-700
                                               dark:bg-violet-950 dark:text-violet-300 shrink-0">
                                📅 {formatVisitDate(reg.visit_date, reg.visit_time)}
                              </span>
                              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                {ev.title ?? "Unknown event"}
                              </span>
                              {ev.location?.city && (
                                <span className="shrink-0 text-xs text-gray-400">
                                  · {ev.location.city}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800">
                        Nothing planned yet
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Shared events inbox ── */}
            {shared.received.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  Events sent to you · {shared.received.length}
                </h2>
                <div className="space-y-3">
                  {shared.received.map((item) => {
                    const ev = item.event_data;
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-3 rounded-2xl border p-4
                          ${item.unread
                            ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30"
                            : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                          {ev.image
                            ? <img src={ev.image} alt={ev.title} className="h-full w-full object-cover"
                                   onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            : <div className="flex h-full items-center justify-center text-xl text-gray-300">🎭</div>
                          }
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-violet-500">✈ from {item.sender_username}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(item.sent_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{ev.title}</p>
                          {(ev.location.city || ev.location.name) && (
                            <p className="text-xs text-gray-400 truncate">
                              📍 {[ev.location.name, ev.location.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {item.message && (
                            <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400 line-clamp-2">
                              &ldquo;{item.message}&rdquo;
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteShared(item.id)}
                          className="shrink-0 self-start rounded-lg border border-gray-200 px-2 py-1 text-xs
                                     text-gray-400 hover:border-red-400 hover:text-red-500 transition
                                     dark:border-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Shared events sent ── */}
            {shared.sent.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  Events you sent · {shared.sent.length}
                </h2>
                <div className="space-y-3">
                  {shared.sent.map((item) => {
                    const ev = item.event_data;
                    return (
                      <div
                        key={item.id}
                        className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4
                                   dark:border-gray-800 dark:bg-gray-900"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                          {ev.image
                            ? <img src={ev.image} alt={ev.title} className="h-full w-full object-cover"
                                   onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            : <div className="flex h-full items-center justify-center text-xl text-gray-300">🎭</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-500">✈ to {item.recipient_username}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(item.sent_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{ev.title}</p>
                          {(ev.location.city || ev.location.name) && (
                            <p className="text-xs text-gray-400 truncate">
                              📍 {[ev.location.name, ev.location.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {item.message && (
                            <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400 line-clamp-2">
                              &ldquo;{item.message}&rdquo;
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteShared(item.id)}
                          className="shrink-0 self-start rounded-lg border border-gray-200 px-2 py-1 text-xs
                                     text-gray-400 hover:border-red-400 hover:text-red-500 transition
                                     dark:border-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </main>
  );
}
