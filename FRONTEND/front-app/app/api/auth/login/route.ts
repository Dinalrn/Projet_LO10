import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { signSession, cookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, password } = body as { login?: string; password?: string };

    if (!login?.trim() || !password) {
      return NextResponse.json(
        { error: "login and password are required" },
        { status: 400 }
      );
    }

    // Accept either username or email in the "login" field
    const result = await pool.query<{
      id: string;
      username: string;
      email: string;
      password_hash: string;
    }>(
      `SELECT id, username, email, password_hash
       FROM users
       WHERE username = $1 OR email = $1
       LIMIT 1`,
      [login.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signSession({
      sub: user.id,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json({
      message: "Logged in",
      username: user.username,
    });
    response.cookies.set(cookieOptions.name, token, cookieOptions);
    return response;

  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
