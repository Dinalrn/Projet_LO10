/**
 * Next.js API route — server-side proxy for the backend /events/{city} endpoint.
 *
 * Responsibilities:
 *   1. Obtain a JWT from the backend using credentials stored in env vars (never
 *      exposed to the browser).
 *   2. Cache the token for its full lifetime to avoid re-logging in on every
 *      request.
 *   3. Proxy the /events/{city} call and return the result to the client.
 */

import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://backend-api-service:8000";
const USERNAME = process.env.AUTH_USERNAME ?? "";
const PASSWORD = process.env.AUTH_PASSWORD ?? "";

// Module-level token cache (lives for the lifetime of the Node.js process)
let _token: string | null = null;
let _tokenExpiry = 0; // Unix ms

async function getToken(): Promise<string> {
  // Return cached token if it has more than 5 minutes left
  if (_token && Date.now() < _tokenExpiry - 5 * 60 * 1000) {
    return _token;
  }

  const res = await fetch(`${BACKEND}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Backend auth failed: ${res.status}`);
  }

  const data = await res.json();
  _token = data.access_token as string;
  // Backend tokens expire in 60 min; cache for 55 min
  _tokenExpiry = Date.now() + 55 * 60 * 1000;
  return _token;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  try {
    const { city } = await params;
    const token = await getToken();

    const res = await fetch(
      `${BACKEND}/events/${encodeURIComponent(city)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API /events] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
