import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://backend-api-service:8000";
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = await getToken();

    const qs = searchParams.toString();
    const res = await fetch(`${BACKEND}/weather${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Backend returned ${res.status}` }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("[API /weather] Error:", err);
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
