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
import { Event, Registration, FriendEventLayer } from "@/types/event";

/* ── Source colours (search results) ────────────────────── */
const SOURCE_COLORS: Record<string, string> = {
  ticketmaster:          "#3b82f6",
  datatourisme:          "#10b981",
  openagenda:            "#f97316",
  "data.culture.gouv.fr": "#ec4899",
};

export { OVERLAY_COLORS } from "@/lib/map-colors";
import { OVERLAY_COLORS } from "@/lib/map-colors";

function pinColor(source: string): string {
  return SOURCE_COLORS[source] ?? "#6b7280";
}

function hasCoords(e: Event): boolean {
  const lat = parseFloat(e.location.lat);
  const lon = parseFloat(e.location.lon);
  return !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;
}

function coords(e: Event): [number, number] {
  return [parseFloat(e.location.lat), parseFloat(e.location.lon)];
}

/* ── Shared popup body ───────────────────────────────────── */
function EventPopupBody({ event }: { event: Event }) {
  return (
    <>
      <p className="font-semibold leading-snug">{event.title || "Untitled"}</p>
      {event.description && (
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{event.description}</p>
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
    </>
  );
}

/* ── Auto-fit bounds when search events change ───────────── */
function BoundsFitter({ events }: { events: Event[] }) {
  const map = useMap();

  useEffect(() => {
    const pts = events.filter(hasCoords).map(coords);
    if (pts.length === 0) return;
    if (pts.length === 1) { map.setView(pts[0], 13); return; }
    const lats = pts.map((p) => p[0]);
    const lons = pts.map((p) => p[1]);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]],
      { padding: [40, 40] }
    );
  }, [events, map]);

  return null;
}

/* ── Props ───────────────────────────────────────────────── */
interface Props {
  events: Event[];
  savedEvents?: Event[];
  myRegistrations?: Registration[];
  friendsEvents?: FriendEventLayer[];
  initialCenter?: [number, number];
  initialZoom?: number;
}

/* ── Main component ──────────────────────────────────────── */
export default function MapView({
  events,
  savedEvents = [],
  myRegistrations = [],
  friendsEvents = [],
  initialCenter = [46.6, 2.3],
  initialZoom = 6,
}: Props) {
  const searchWithCoords = events.filter(hasCoords);

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

      {/* ── Search result markers ── */}
      {searchWithCoords.map((event) => {
        const color = pinColor(event.source);
        return (
          <CircleMarker
            key={`search-${event.id}`}
            center={coords(event)}
            radius={8}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1.5 }}
          >
            <Popup maxWidth={260}>
              <div className="text-sm">
                <EventPopupBody event={event} />
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

      {/* ── Saved events layer ── */}
      {savedEvents.filter(hasCoords).map((event) => (
        <CircleMarker
          key={`saved-${event.id}`}
          center={coords(event)}
          radius={10}
          pathOptions={{
            color: OVERLAY_COLORS.saved,
            fillColor: OVERLAY_COLORS.saved,
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup maxWidth={260}>
            <div className="text-sm">
              <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5
                               text-[10px] font-semibold text-amber-700">
                📌 Saved
              </span>
              <EventPopupBody event={event} />
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* ── My registrations layer ── */}
      {myRegistrations.filter((r) => hasCoords(r.event_data)).map((reg) => (
        <CircleMarker
          key={`reg-${reg.event_data.id}`}
          center={coords(reg.event_data)}
          radius={10}
          pathOptions={{
            color: OVERLAY_COLORS.registered,
            fillColor: OVERLAY_COLORS.registered,
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup maxWidth={260}>
            <div className="text-sm">
              <span className="mb-1 inline-block rounded-full bg-violet-100 px-2 py-0.5
                               text-[10px] font-semibold text-violet-700">
                📅 Going · {reg.visit_date}{reg.visit_time ? ` · ${reg.visit_time}` : ""}
              </span>
              <EventPopupBody event={reg.event_data} />
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* ── Friends' events layer ── */}
      {friendsEvents.filter((f) => hasCoords(f.event)).map((f, i) => (
        <CircleMarker
          key={`friend-${f.friend_username}-${f.event.id}-${i}`}
          center={coords(f.event)}
          radius={10}
          pathOptions={{
            color: OVERLAY_COLORS.friends,
            fillColor: OVERLAY_COLORS.friends,
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup maxWidth={260}>
            <div className="text-sm">
              <span className="mb-1 inline-block rounded-full bg-teal-100 px-2 py-0.5
                               text-[10px] font-semibold text-teal-700">
                👥 {f.friend_username} · {f.visit_date}{f.visit_time ? ` · ${f.visit_time}` : ""}
              </span>
              <EventPopupBody event={f.event} />
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {events.length > 0 && <BoundsFitter events={searchWithCoords} />}
    </MapContainer>
  );
}
