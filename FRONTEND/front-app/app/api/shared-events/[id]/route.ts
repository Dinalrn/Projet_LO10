import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

/** PATCH — mark a received event as read. */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query(
    `UPDATE shared_events SET read_at = NOW()
     WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL`,
    [id, session.sub]
  );
  return NextResponse.json({ read: true });
}

/** DELETE — sender or recipient can remove their copy. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query(
    `DELETE FROM shared_events
     WHERE id = $1 AND (sender_id = $2 OR recipient_id = $2)`,
    [id, session.sub]
  );
  return NextResponse.json({ deleted: true });
}
