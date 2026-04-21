import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession, signSession, cookieOptions } from "@/lib/session";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newUsername, newPassword } = body as {
      currentPassword?: string;
      newUsername?: string;
      newPassword?: string;
    };

    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    if (!newUsername && !newPassword) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const result = await pool.query<{ id: string; username: string; email: string; password_hash: string }>(
      `SELECT id, username, email, password_hash FROM users WHERE id = $1`,
      [session.sub]
    );
    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (newUsername && newUsername.trim() !== user.username) {
      const trimmed = newUsername.trim().toLowerCase();
      const conflict = await pool.query(
        `SELECT id FROM users WHERE username = $1 AND id <> $2`,
        [trimmed, user.id]
      );
      if (conflict.rows.length > 0) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
      params.push(trimmed);
      updates.push(`username = $${params.length}`);
    }

    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      params.push(hash);
      updates.push(`password_hash = $${params.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No changes applied" });
    }

    params.push(user.id);
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${params.length}`,
      params
    );

    const updatedUsername = newUsername?.trim().toLowerCase() ?? user.username;
    const token = await signSession({ sub: user.id, username: updatedUsername, email: user.email });
    const response = NextResponse.json({ message: "Profile updated", username: updatedUsername });
    response.cookies.set(cookieOptions.name, token, cookieOptions);
    return response;

  } catch (err) {
    console.error("[auth/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
