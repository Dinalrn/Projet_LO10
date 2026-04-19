"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Event } from "@/types/event";

/* ── Source colours ──────────────────────────────────────── */
const SOURCE_COLORS: Record<string, string> = {
  ticketmaster: "#3b82f6",   // blue-500
  datatourisme: "#10b981",   // emerald-500
  openagenda:   "#f97316",   // orange-500
  "data.culture.gouv.fr": "#ec4899", // pink-500
};

function pinColor(source: string): string {
  return SOURCE_COLORS[source] ?? "#6b7280"; // gray-500
}

/* ── Auto-fit bounds when events change ──────────────────── */
function BoundsFitter({ events }: { events: Event[] }) {
  const map = useMap();

  useEffect(() => {
    const pts = events
      .map((e) => ({
        lat: parseFloat(e.location.lat),
        lon: parseFloat(e.location.lon),
      }))
      .filter((p) => !isNaN(p.lat) && !isNaN(p.lon));

    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lon], 13);
      return;
    }

    const lats = pts.map((p) => p.lat);
    const lons = pts.map((p) => p.lon);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ],
      { padding: [40, 40] }
    );
  }, [events, map]);

  return null;
}


/* ── Main map component ──────────────────────────────────── */
interface Props {
  events: Event[];
  initialCenter?: [number, number];
  initialZoom?: number;
}

export default function MapView({
  events,
  initialCenter = [46.6, 2.3], // centre of France
  initialZoom = 6,
}: Props) {
  const eventsWithCoords = events.filter((e) => {
    const lat = parseFloat(e.location.lat);
    const lon = parseFloat(e.location.lon);
    return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;
  });

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {eventsWithCoords.map((event) => {
        const lat = parseFloat(event.location.lat);
        const lon = parseFloat(event.location.lon);
        const color = pinColor(event.source);

        return (
          <CircleMarker
            key={event.id}
            center={[lat, lon]}
            radius={8}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.8,
              weight: 1.5,
            }}
          >
            <Popup maxWidth={260}>
              <div className="text-sm">
                <p className="font-semibold leading-snug">{event.title || "Untitled"}</p>

                {event.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-3">{event.description}</p>
                )}

                <div className="mt-2 space-y-0.5 text-xs text-gray-600">
                  {event.date && (
                    <p>📅 {event.date}{event.time ? ` · ${event.time.slice(0, 5)}` : ""}</p>
                  )}
                  {(event.location.name || event.location.city) && (
                    <p>📍 {[event.location.name, event.location.city].filter(Boolean).join(", ")}</p>
                  )}
                  <p>🎟️ {event.price > 0 ? `${event.price} €` : "Free"}</p>
                </div>

                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {event.source}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {events.length > 0 && <BoundsFitter events={eventsWithCoords} />}
    </MapContainer>
  );
}
