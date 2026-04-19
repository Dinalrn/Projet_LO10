import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

/** PATCH — accept or decline a received request. Only the addressee can act. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await request.json() as { action: "accept" | "decline" };

  if (action === "accept") {
    const { rowCount } = await pool.query(
      `UPDATE friendships SET status = 'accepted'
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'`,
      [id, session.sub]
    );
    if (!rowCount) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ accepted: true });
  }

  if (action === "decline") {
    await pool.query(
      `DELETE FROM friendships
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'`,
      [id, session.sub]
    );
    return NextResponse.json({ declined: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/** DELETE — cancel a sent request or remove an accepted friendship. Either party can act. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query(
    `DELETE FROM friendships
     WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)`,
    [id, session.sub]
  );
  return NextResponse.json({ removed: true });
}
