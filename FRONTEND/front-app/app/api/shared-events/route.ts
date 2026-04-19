import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ rows: received }, { rows: sent }] = await Promise.all([
    pool.query(
      `SELECT se.id,
              u.username                            AS sender_username,
              se.event_data,
              se.message,
              to_char(se.sent_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS sent_at,
              se.read_at IS NULL                    AS unread
       FROM shared_events se
       JOIN users u ON u.id = se.sender_id
       WHERE se.recipient_id = $1
       ORDER BY se.sent_at DESC`,
      [session.sub]
    ),
    pool.query(
      `SELECT se.id,
              u.username                            AS recipient_username,
              se.event_data,
              se.message,
              to_char(se.sent_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS sent_at,
              se.read_at IS NULL                    AS unread
       FROM shared_events se
       JOIN users u ON u.id = se.recipient_id
       WHERE se.sender_id = $1
       ORDER BY se.sent_at DESC`,
      [session.sub]
    ),
  ]);

  return NextResponse.json({ received, sent });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event, recipient_id, message } = await request.json() as {
    event: { id: string; source: string };
    recipient_id: string;
    message?: string;
  };

  if (!event?.id || !event?.source || !recipient_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (recipient_id === session.sub) {
    return NextResponse.json({ error: "Cannot send to yourself" }, { status: 400 });
  }

  // Verify they are actually friends
  const { rows } = await pool.query(
    `SELECT id FROM friendships
     WHERE ((requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1))
       AND status = 'accepted'`,
    [session.sub, recipient_id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not friends with this user" }, { status: 403 });
  }

  await pool.query(
    `INSERT INTO shared_events
       (sender_id, recipient_id, external_event_id, source, event_data, message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [session.sub, recipient_id, event.id, event.source, JSON.stringify(event), message?.trim() || null]
  );

  return NextResponse.json({ shared: true });
}
