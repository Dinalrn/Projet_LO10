import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** Returns the current user's public info, or 401 if not logged in. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    id: session.sub,
    username: session.username,
    email: session.email,
  });
}
