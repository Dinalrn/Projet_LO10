"use client";

import { useState } from "react";

interface Props {
  onLocate: (city: string) => void;
  compact?: boolean; // smaller variant for the map header
}

async function resolveCity(): Promise<string> {
  // 1️⃣ Browser geolocation (asks the user for permission)
  if (typeof navigator !== "undefined" && "geolocation" in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 60_000,
        })
      );
      const { latitude: lat, longitude: lon } = position.coords;

      // Reverse-geocode to city name via Nominatim (OSM)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
        { headers: { "User-Agent": "WannaGo/1.0" } }
      );
      const data = await res.json();
      const addr = data.address ?? {};
      const city =
        addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county;
      if (city) return city as string;
    } catch {
      // Permission denied or timeout — fall through to IP fallback
    }
  }

  // 2️⃣ IP-based geolocation fallback (no permission needed, ~city-level accuracy)
  const res = await fetch("https://ipapi.co/json/");
  if (!res.ok) throw new Error("IP geolocation failed");
  const data = await res.json();
  if (data.city) return data.city as string;

  throw new Error("Could not detect your city");
}

export default function LocateButton({ onLocate, compact = false }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClick = async () => {
    setState("loading");
    setErrorMsg("");
    try {
      const city = await resolveCity();
      setState("idle");
      onLocate(city);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Location unavailable";
      setErrorMsg(msg);
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        title="Events near me"
        aria-label="Detect my location"
        className="flex items-center justify-center rounded-lg border border-gray-600
                   p-1.5 text-gray-400 transition hover:border-violet-500 hover:text-violet-400
                   disabled:opacity-50"
      >
        {state === "loading" ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300
                   bg-white px-4 py-2 text-sm font-medium text-gray-600 transition
                   hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50
                   disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900
                   dark:text-gray-400 dark:hover:border-violet-500 dark:hover:text-violet-400
                   dark:hover:bg-violet-950/30"
      >
        {state === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Detecting your location…
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
            </svg>
            Events around you?
          </>
        )}
      </button>
      {state === "error" && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}
