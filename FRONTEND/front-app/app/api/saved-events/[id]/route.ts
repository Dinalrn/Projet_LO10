import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query(
    "DELETE FROM saved_events WHERE user_id = $1 AND external_event_id = $2",
    [session.sub, id]
  );
  return NextResponse.json({ removed: true });
}
