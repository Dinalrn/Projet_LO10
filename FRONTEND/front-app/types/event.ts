export interface EventLocation {
  name: string;
  city: string;
  lat: string;
  lon: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: EventLocation;
  price: number;
  image: string;
  source: string;
}

export interface SourceStat {
  status: "ok" | "error";
  count: number;
}

export interface EventsResponse {
  city: string;
  total: number;
  events: Event[];
  sources?: Record<string, SourceStat>;
}
