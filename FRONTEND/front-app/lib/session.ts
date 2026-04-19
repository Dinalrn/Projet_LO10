/**
 * Session helpers — JWT signed with HS256, stored in an httpOnly cookie.
 * Uses `jose` which works in both Node.js and Edge runtimes.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "wannago_session";
const EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET_KEY ?? "change-me-in-production-please";
  return new TextEncoder().encode(raw);
}

export interface SessionPayload {
  sub: string;      // user UUID
  username: string;
  email: string;
}

/** Create a signed JWT for the given user. */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_SECONDS}s`)
    .sign(getSecret());
}

/** Verify a JWT and return its payload, or null if invalid / expired. */
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Read the session from the incoming request cookie store (Server Components / API Routes).
 * Returns null if no valid session.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Cookie options shared between set and delete. */
export const cookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: EXPIRES_SECONDS,
};
