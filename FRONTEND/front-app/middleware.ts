/**
 * Next.js Edge Middleware — protects /pages and /map behind auth.
 * Runs before every matched request; uses jose (Edge-compatible JWT verification).
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@/lib/session";

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET_KEY ?? "change-me-in-production-please";
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    // Token expired or tampered — clear cookie and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  // Protect the event list page and the map page.
  // /api/auth/* and /login are NOT matched, so they stay public.
  matcher: ["/pages/:path*", "/map/:path*", "/saved/:path*", "/saved"],
};
