import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

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

async function logSearch(userId: string, city: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_search_history (user_id, city) VALUES ($1, $2)`,
      [userId, city.toLowerCase()]
    );
    // Keep only the last 50 searches per user
    await pool.query(
      `DELETE FROM user_search_history
       WHERE user_id = $1
         AND id NOT IN (
           SELECT id FROM user_search_history
           WHERE user_id = $1
           ORDER BY searched_at DESC
           LIMIT 50
         )`,
      [userId]
    );
  } catch {
    // Non-critical — never let search history logging break an events request
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  try {
    const { city } = await params;
    const token = await getToken();

    const { searchParams } = new URL(request.url);
    const radiusKm = searchParams.get("radius_km") ?? "30";

    // Log search for logged-in users (fire-and-forget)
    const session = await getSession();
    if (session) logSearch(session.sub, city);

    const res = await fetch(
      `${BACKEND}/events/${encodeURIComponent(city)}?radius_km=${radiusKm}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Backend returned ${res.status}` }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("[API /events] Error:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
