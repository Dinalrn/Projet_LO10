import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import type { Event } from "@/types/event";

const BACKEND = process.env.BACKEND_URL ?? "http://backend-api-service:8000";
const USERNAME = process.env.AUTH_USERNAME ?? "";
const PASSWORD = process.env.AUTH_PASSWORD ?? "";

let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry - 5 * 60 * 1000) return _token;
  const res = await fetch(`${BACKEND}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Backend auth failed: ${res.status}`);
  const data = await res.json();
  _token = data.access_token as string;
  _tokenExpiry = Date.now() + 55 * 60 * 1000;
  return _token;
}

// Type exported for use in the RecommendationsStrip component
export interface RecommendedEvent extends Event {
  score: number;
  reasons: string[];
}

interface UserContext {
  preferredCategories: Set<string>;
  registeredIds: Set<string>;
  myPastCategories: Set<string>;
  savedIds: Set<string>;
  friendCategories: Map<string, number>;
}

function normalizeCategory(cat: string | undefined | null): string {
  return (cat ?? "").toLowerCase().trim();
}

async function fetchUserContext(userId: string): Promise<UserContext> {
  const [prefRows, regRows, savedRows, friendRegRows] = await Promise.all([
    pool.query("SELECT category FROM user_preferences WHERE user_id = $1", [userId]),
    pool.query(
      "SELECT external_event_id, event_data->>'category' AS category FROM event_registrations WHERE user_id = $1",
      [userId]
    ),
    pool.query("SELECT external_event_id FROM saved_events WHERE user_id = $1", [userId]),
    pool.query(
      `SELECT er.event_data->>'category' AS category
       FROM event_registrations er
       WHERE er.user_id IN (
         SELECT CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
         FROM friendships f
         WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted'
       )`,
      [userId]
    ),
  ]);

  const friendCategories = new Map<string, number>();
  for (const row of friendRegRows.rows) {
    const cat = normalizeCategory(row.category);
    if (cat) friendCategories.set(cat, (friendCategories.get(cat) ?? 0) + 1);
  }

  return {
    preferredCategories: new Set(prefRows.rows.map((r) => r.category as string)),
    registeredIds: new Set(regRows.rows.map((r) => r.external_event_id as string)),
    myPastCategories: new Set(
      regRows.rows.map((r) => normalizeCategory(r.category)).filter(Boolean)
    ),
    savedIds: new Set(savedRows.rows.map((r) => r.external_event_id as string)),
    friendCategories,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ recommendations: [] });

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const radiusKm = searchParams.get("radius_km") ?? "30";

  if (!city) return NextResponse.json({ error: "city is required" }, { status: 400 });

  try {
    const [token, ctx] = await Promise.all([
      getToken(),
      fetchUserContext(session.sub),
    ]);

    const res = await fetch(`${BACKEND}/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        city,
        radius_km: parseInt(radiusKm),
        user_context: {
          preferred_categories: [...ctx.preferredCategories],
          registered_ids: [...ctx.registeredIds],
          past_categories: [...ctx.myPastCategories],
          saved_ids: [...ctx.savedIds],
          friend_categories: Object.fromEntries(ctx.friendCategories),
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json({ recommendations: [] });
    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("[API /recommendations] Error:", err);
    return NextResponse.json({ recommendations: [] });
  }
}
