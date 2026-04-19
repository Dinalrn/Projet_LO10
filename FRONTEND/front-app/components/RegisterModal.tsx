"use client";

import { useState } from "react";
import { Event } from "@/types/event";

interface Props {
  event: Event;
  onConfirm: (visitDate: string, visitTime: string) => Promise<void>;
  onClose: () => void;
}

export default function RegisterModal({ event, onConfirm, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [visitDate, setVisitDate] = useState(event.date || today);
  const [visitTime, setVisitTime] = useState(event.time?.slice(0, 5) || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(visitDate, visitTime);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-400 mb-1">
            Register for event
          </p>
          <h2 className="text-lg font-bold text-white line-clamp-2">
            {event.title || "Untitled event"}
          </h2>
          {(event.location.city || event.location.name) && (
            <p className="mt-1 text-sm text-gray-400">
              📍 {[event.location.name, event.location.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-300">
              Day you plan to go
              {event.date && (
                <span className="ml-2 text-gray-500 font-normal">
                  (event date: {event.date})
                </span>
              )}
            </label>
            <input
              type="date"
              required
              value={visitDate}
              min={today}
              onChange={(e) => setVisitDate(e.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm
                         text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-300">
              Time{" "}
              <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm
                         text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              disabled={loading || !visitDate}
              className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white
                         hover:bg-violet-700 transition disabled:opacity-50"
            >
              {loading ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
