import { Event } from "@/types/event";
import EventCard from "./EventCard";

interface Props {
  events: Event[];
  savedIds?: Set<string>;
  onToggleSave?: (event: Event) => Promise<void>;
}

export default function EventList({ events, savedIds, onToggleSave }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isSaved={savedIds?.has(event.id)}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
