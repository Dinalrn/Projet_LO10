"use client";

import { useState } from "react";
import { Event } from "@/types/event";

interface Friend {
  friend_id: string;
  friend_username: string;
}

interface Props {
  event: Event;
  friends: Friend[];
  onConfirm: (recipientId: string, message: string) => Promise<void>;
  onClose: () => void;
}

export default function ShareEventModal({ event, friends, onConfirm, onClose }: Props) {
  const [recipientId, setRecipientId] = useState(friends[0]?.friend_id ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId) return;
    setLoading(true);
    try {
      await onConfirm(recipientId, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-400 mb-1">
            Send to a friend
          </p>
          <h2 className="text-lg font-bold text-white line-clamp-2">
            {event.title || "Untitled event"}
          </h2>
          {(event.location.city || event.location.name) && (
            <p className="mt-1 text-sm text-gray-400">
              📍 {[event.location.name, event.location.city].filter(Boolean).join(", ")}
            </p>
          )}
          {event.date && (
            <p className="text-sm text-gray-400">📅 {event.date}{event.time ? ` · ${event.time.slice(0, 5)}` : ""}</p>
          )}
        </div>

        {friends.length === 0 ? (
          <div className="rounded-xl bg-gray-800 p-4 text-center text-sm text-gray-400">
            You have no friends to send events to yet.<br />
            Add friends on the{" "}
            <a href="/friends" className="text-violet-400 hover:underline">Friends page</a>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Friend selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-300">Send to</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm
                           text-white focus:border-violet-500 focus:outline-none"
              >
                {friends.map((f) => (
                  <option key={f.friend_id} value={f.friend_id}>
                    {f.friend_username}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-300">
                Message{" "}
                <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hey, check this out!"
                rows={3}
                maxLength={300}
                className="resize-none rounded-lg border border-gray-600 bg-gray-800 px-3 py-2
                           text-sm text-white placeholder-gray-500 focus:border-violet-500
                           focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-600 py-2 text-sm font-medium
                           text-gray-300 hover:border-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !recipientId}
                className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white
                           hover:bg-violet-700 transition disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send ✈"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
