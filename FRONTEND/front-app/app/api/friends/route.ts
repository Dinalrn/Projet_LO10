import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

/** GET — return accepted friends (with their going events), received requests, sent requests. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.sub;

  // Accepted friends — current user appears on either side
  const { rows: friendRows } = await pool.query(
    `SELECT
       f.id                                                      AS friendship_id,
       CASE WHEN f.requester_id = $1 THEN ua.id   ELSE ur.id   END AS friend_id,
       CASE WHEN f.requester_id = $1 THEN ua.username ELSE ur.username END AS friend_username,
       CASE WHEN f.requester_id = $1 THEN ua.avatar_url ELSE ur.avatar_url END AS friend_avatar
     FROM friendships f
     JOIN users ur ON ur.id = f.requester_id
     JOIN users ua ON ua.id = f.addressee_id
     WHERE (f.requester_id = $1 OR f.addressee_id = $1)
       AND f.status = 'accepted'
     ORDER BY friend_username`,
    [uid]
  );

  // Fetch going events for all friends in one query
  const friendIds: string[] = friendRows.map((r) => r.friend_id);
  const goingByFriend: Record<string, { event_data: unknown; visit_date: string; visit_time: string | null }[]> = {};
  if (friendIds.length > 0) {
    const { rows: goingRows } = await pool.query(
      `SELECT user_id,
              event_data,
              to_char(visit_date, 'YYYY-MM-DD') AS visit_date,
              to_char(visit_time, 'HH24:MI')    AS visit_time
       FROM event_registrations
       WHERE user_id = ANY($1::uuid[])
       ORDER BY visit_date ASC`,
      [friendIds]
    );
    for (const row of goingRows) {
      if (!goingByFriend[row.user_id]) goingByFriend[row.user_id] = [];
      goingByFriend[row.user_id].push({
        event_data: row.event_data,
        visit_date: row.visit_date,
        visit_time: row.visit_time,
      });
    }
  }

  // Pending friend requests received by current user
  const { rows: receivedRows } = await pool.query(
    `SELECT f.id, u.id AS requester_id, u.username AS requester_username
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [uid]
  );

  // Pending friend requests sent by current user
  const { rows: sentRows } = await pool.query(
    `SELECT f.id, u.id AS addressee_id, u.username AS addressee_username
     FROM friendships f
     JOIN users u ON u.id = f.addressee_id
     WHERE f.requester_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [uid]
  );

  return NextResponse.json({
    friends: friendRows.map((r) => ({
      friendship_id: r.friendship_id,
      friend_id: r.friend_id,
      friend_username: r.friend_username,
      friend_avatar: r.friend_avatar ?? null,
      going: goingByFriend[r.friend_id] ?? [],
    })),
    pending_received: receivedRows,
    pending_sent: sentRows,
  });
}

/** POST — send a friend request by username. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await request.json() as { username: string };
  if (!username?.trim()) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  // Find target user
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [username.trim()]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const targetId: string = rows[0].id;

  if (targetId === session.sub) {
    return NextResponse.json({ error: "You cannot add yourself" }, { status: 400 });
  }

  // Check if any friendship already exists in either direction
  const { rows: existing } = await pool.query(
    `SELECT id, status FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [session.sub, targetId]
  );
  if (existing.length > 0) {
    const status = existing[0].status;
    const msg =
      status === "accepted" ? "Already friends" :
      status === "pending"  ? "Request already pending" :
                              "Cannot send request";
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  await pool.query(
    "INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2)",
    [session.sub, targetId]
  );
  return NextResponse.json({ sent: true });
}
