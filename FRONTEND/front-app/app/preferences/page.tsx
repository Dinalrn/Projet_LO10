"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

const ALL_CATEGORIES = [
  "Music", "Concerts", "Sports", "Arts & Culture", "Theater",
  "Festivals", "Exhibitions", "Food & Wine", "Cinema", "Dance",
  "Comedy", "Nature & Outdoor", "Heritage", "Markets", "Conferences",
  "Children", "Photography", "Literature", "Architecture", "Circus",
];

export default function PreferencesPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsername(d.username ?? null))
      .catch(() => null);

    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.categories)) {
          // Stored lowercase, match back to display names
          const stored = new Set(d.categories as string[]);
          const matched = new Set(
            ALL_CATEGORIES.filter((c) => stored.has(c.toLowerCase()))
          );
          setSelected(matched);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (cat: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: [...selected] }),
    }).catch(() => null);
    setSaving(false);
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-4 py-16">

        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex justify-end mb-2">
            {username && <UserMenu username={username} />}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Wanna<span className="text-violet-600">Go</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            Your preferences
          </p>
          <nav className="mt-4 flex justify-center gap-2 text-sm font-medium flex-wrap">
            {[
              { href: "/pages", label: "List" },
              { href: "/map", label: "Map" },
              { href: "/saved", label: "Saved" },
              { href: "/registered", label: "Going" },
              { href: "/friends", label: "Friends" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                           hover:border-violet-400 hover:text-violet-600 transition
                           dark:border-gray-700 dark:text-gray-300 dark:hover:border-violet-500
                           dark:hover:text-violet-400">
                {label}
              </Link>
            ))}
            <span className="rounded-lg bg-violet-600 px-4 py-1.5 text-white">Preferences</span>
          </nav>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Select the categories you enjoy — these feed your <span className="font-semibold text-violet-500">For You</span> recommendations.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ALL_CATEGORIES.map((cat) => {
                const active = selected.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggle(cat)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition
                      ${active
                        ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-violet-400 hover:text-violet-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-violet-500 dark:hover:text-violet-400"
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white
                           hover:bg-violet-700 disabled:opacity-50 transition"
              >
                {saving ? "Saving…" : "Save preferences"}
              </button>
              {saved && (
                <span className="text-sm font-medium text-green-500">
                  Saved! Your recommendations will update on the next search.
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
