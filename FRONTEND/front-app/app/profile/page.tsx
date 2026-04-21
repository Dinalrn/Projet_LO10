"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function ProfilePage() {
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Username form
  const [newUsername, setNewUsername] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setCurrentUsername(d.username ?? null);
        setNewUsername(d.username ?? "");
      })
      .catch(() => null);
  }, []);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameStatus(null);
    setUsernameLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: usernamePassword, newUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameStatus({ ok: false, msg: data.error ?? "Update failed" });
      } else {
        setCurrentUsername(data.username);
        setUsernamePassword("");
        setUsernameStatus({ ok: true, msg: "Username updated successfully" });
      }
    } catch {
      setUsernameStatus({ ok: false, msg: "Network error" });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ ok: false, msg: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ ok: false, msg: "Password must be at least 6 characters" });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordStatus({ ok: false, msg: data.error ?? "Update failed" });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordStatus({ ok: true, msg: "Password updated successfully" });
      }
    } catch {
      setPasswordStatus({ ok: false, msg: "Network error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 " +
    "focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 " +
    "dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-violet-50 " +
    "dark:focus:border-violet-500 dark:placeholder-violet-400/40";

  const labelClass = "block text-xs font-medium text-gray-500 dark:text-violet-300/70 mb-1";

  const btnClass =
    "rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white " +
    "hover:bg-violet-700 transition disabled:opacity-50";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16">

        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex justify-end mb-2">
            {currentUsername && <UserMenu username={currentUsername} />}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-violet-50">
            Wanna<span className="text-violet-600">Go</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-violet-300/70">Profile settings</p>
          <nav className="mt-4 flex justify-center gap-2 text-sm font-medium">
            <Link href="/pages"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-violet-900/50 dark:text-violet-300/70 dark:hover:border-violet-500
                         dark:hover:text-violet-300">
              List
            </Link>
            <Link href="/saved"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-violet-900/50 dark:text-violet-300/70 dark:hover:border-violet-500
                         dark:hover:text-violet-300">
              Saved
            </Link>
            <Link href="/registered"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-violet-900/50 dark:text-violet-300/70 dark:hover:border-violet-500
                         dark:hover:text-violet-300">
              Going
            </Link>
            <Link href="/friends"
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-gray-600
                         hover:border-violet-400 hover:text-violet-600 transition
                         dark:border-violet-900/50 dark:text-violet-300/70 dark:hover:border-violet-500
                         dark:hover:text-violet-300">
              Friends
            </Link>
          </nav>
        </header>

        <div className="mx-auto max-w-md space-y-8">

          {/* Change username */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm
                              dark:border-violet-900/40 dark:bg-violet-950/20">
            <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-violet-50">
              Change username
            </h2>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>New username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  minLength={3}
                  className={inputClass}
                  placeholder="Enter new username"
                />
              </div>
              <div>
                <label className={labelClass}>Current password</label>
                <input
                  type="password"
                  value={usernamePassword}
                  onChange={(e) => setUsernamePassword(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Confirm with your password"
                />
              </div>
              {usernameStatus && (
                <p className={`text-sm ${usernameStatus.ok ? "text-green-600" : "text-red-500"}`}>
                  {usernameStatus.msg}
                </p>
              )}
              <button type="submit" disabled={usernameLoading} className={btnClass}>
                {usernameLoading ? "Saving…" : "Save username"}
              </button>
            </form>
          </section>

          {/* Change password */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm
                              dark:border-violet-900/40 dark:bg-violet-950/20">
            <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-violet-50">
              Change password
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Your current password"
                />
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Repeat new password"
                />
              </div>
              {passwordStatus && (
                <p className={`text-sm ${passwordStatus.ok ? "text-green-600" : "text-red-500"}`}>
                  {passwordStatus.msg}
                </p>
              )}
              <button type="submit" disabled={passwordLoading} className={btnClass}>
                {passwordLoading ? "Saving…" : "Save password"}
              </button>
            </form>
          </section>

        </div>
      </div>
    </main>
  );
}
