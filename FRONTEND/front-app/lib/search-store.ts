const STORAGE_KEY = "wannago:last-search";

export interface LastSearch {
  city: string;
  radius: number;
}

export function saveSearch(city: string, radius: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, radius }));
}

export function loadSearch(): LastSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LastSearch) : null;
  } catch {
    return null;
  }
}
