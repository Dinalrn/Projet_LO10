import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND  = process.env.BACKEND_URL  ?? "http://backend-api-service:8000";
const USERNAME = process.env.AUTH_USERNAME ?? "";
const PASSWORD = process.env.AUTH_PASSWORD ?? "";

let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry - 5 * 60 * 1000) return _token;
  const res = await fetch(`${BACKEND}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Backend auth failed: ${res.status}`);
  const data = await res.json();
  _token = data.access_token as string;
  _tokenExpiry = Date.now() + 55 * 60 * 1000;
  return _token;
}

export async function POST(request: NextRequest) {
  try {
    const body  = await request.json();
    const token = await getToken();

    // The backend JWT carries sub="admin" (placeholder auth), so the backend
    // cannot resolve the real user's email from the DB.
    // We resolve it here from the session cookie and pass it explicitly.
    let recipientEmail: string | null = body.recipient_email ?? null;
    if (!recipientEmail) {
      const session = await getSession();
      recipientEmail = session?.email ?? null;
    }

    const res = await fetch(`${BACKEND}/mail/send-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...body, recipient_email: recipientEmail }),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[API /mail/send-event] Error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
