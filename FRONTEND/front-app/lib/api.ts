import { EventsResponse } from "@/types/event";

/**
 * Fetch events for a city by calling our own Next.js API route,
 * which handles backend authentication server-side.
 */
export async function fetchEvents(city: string): Promise<EventsResponse> {
  const res = await fetch(`/api/events/${encodeURIComponent(city)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Events request failed (${res.status}): ${body}`);
  }

  return res.json();
}
