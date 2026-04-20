import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

/** GET — return the user's preferred categories. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    "SELECT category FROM user_preferences WHERE user_id = $1 ORDER BY category",
    [session.sub]
  );
  return NextResponse.json({ categories: rows.map((r) => r.category) });
}

/** PUT — replace the user's full category list. Body: { categories: string[] } */
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { categories } = await request.json() as { categories: string[] };
  if (!Array.isArray(categories)) {
    return NextResponse.json({ error: "categories must be an array" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_preferences WHERE user_id = $1", [session.sub]);
    for (const cat of categories) {
      if (typeof cat === "string" && cat.trim()) {
        await client.query(
          "INSERT INTO user_preferences (user_id, category) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [session.sub, cat.trim().toLowerCase()]
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[API /preferences] Error:", err);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ saved: true });
}
