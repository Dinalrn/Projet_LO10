import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { signSession, cookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password } = body as {
      username?: string;
      email?: string;
      password?: string;
    };

    // ── Validation ──────────────────────────────────────────
    if (!username?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "username, email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // ── Hash password ────────────────────────────────────────
    const password_hash = await bcrypt.hash(password, 12);

    // ── Insert user ──────────────────────────────────────────
    const result = await pool.query<{ id: string; username: string; email: string }>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username.trim(), email.trim().toLowerCase(), password_hash]
    );

    const user = result.rows[0];

    // ── Create session cookie ─────────────────────────────────
    const token = await signSession({
      sub: user.id,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json(
      { message: "Account created", username: user.username },
      { status: 201 }
    );
    response.cookies.set(cookieOptions.name, token, cookieOptions);
    return response;

  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === "23505") {
      // Unique-violation: username or email already taken
      return NextResponse.json(
        { error: "Username or email already in use" },
        { status: 409 }
      );
    }
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
