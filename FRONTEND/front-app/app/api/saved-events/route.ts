import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    "SELECT event_data FROM saved_events WHERE user_id = $1 ORDER BY saved_at DESC",
    [session.sub]
  );
  return NextResponse.json({ events: rows.map((r) => r.event_data) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await request.json();
  if (!event?.id || !event?.source) {
    return NextResponse.json({ error: "Missing event id or source" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO saved_events (user_id, external_event_id, source, event_data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, external_event_id) DO NOTHING`,
    [session.sub, event.id, event.source, JSON.stringify(event)]
  );
  return NextResponse.json({ saved: true });
}
