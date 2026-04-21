"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  onSearch: (city: string) => void;
  loading: boolean;
  radius?: number;
  onRadiusChange?: (value: number) => void;
}

export default function SearchBar({ onSearch, loading, radius = 30, onRadiusChange }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto gap-3">
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Enter a city… e.g. Paris, Troyes"
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-900
                     placeholder-gray-400 shadow-sm outline-none ring-0
                     focus:border-violet-500 focus:ring-2 focus:ring-violet-200
                     dark:border-violet-800/50 dark:bg-[#1a1730] dark:text-violet-50
                     dark:placeholder-violet-400/40 dark:focus:border-violet-500
                     dark:focus:ring-violet-900/50 disabled:opacity-50 transition"
        />
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3
                     font-semibold text-white shadow-sm hover:bg-violet-700
                     active:bg-violet-800 disabled:opacity-50 transition"
        >
          {loading ? (
            <>
              <Spinner />
              Searching…
            </>
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Radius slider */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs text-gray-400 dark:text-violet-400/50 shrink-0">5 km</span>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={radius}
          onChange={(e) => onRadiusChange?.(Number(e.target.value))}
          disabled={loading}
          className="flex-1 accent-violet-600 disabled:opacity-50"
        />
        <span className="text-xs text-gray-400 dark:text-violet-400/50 shrink-0">50 km</span>
        <span className="text-xs font-semibold text-violet-600 w-14 text-right shrink-0">
          {radius} km
        </span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
