import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT event_data,
            to_char(visit_date, 'YYYY-MM-DD') AS visit_date,
            to_char(visit_time, 'HH24:MI')    AS visit_time
     FROM event_registrations
     WHERE user_id = $1
     ORDER BY visit_date ASC, registered_at DESC`,
    [session.sub]
  );
  return NextResponse.json({ registrations: rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { event, visit_date, visit_time } = body as {
    event: { id: string; source: string };
    visit_date: string;
    visit_time?: string;
  };

  if (!event?.id || !event?.source || !visit_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO event_registrations
       (user_id, external_event_id, source, event_data, visit_date, visit_time)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, external_event_id)
     DO UPDATE SET visit_date = EXCLUDED.visit_date,
                   visit_time = EXCLUDED.visit_time,
                   event_data = EXCLUDED.event_data`,
    [
      session.sub,
      event.id,
      event.source,
      JSON.stringify(event),
      visit_date,
      visit_time || null,
    ]
  );
  return NextResponse.json({ registered: true });
}
