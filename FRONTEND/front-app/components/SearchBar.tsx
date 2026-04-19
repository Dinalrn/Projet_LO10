"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  onSearch: (city: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex w-full max-w-xl mx-auto gap-3">
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
                   dark:border-gray-700 dark:bg-gray-900 dark:text-white
                   dark:placeholder-gray-500 dark:focus:border-violet-400
                   dark:focus:ring-violet-900 disabled:opacity-50 transition"
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
