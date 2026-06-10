import { SignJWT, jwtVerify } from "jose";
import { env, requireEnv } from "./env";

export const SESSION_COOKIE = "life_session";
const SESSION_DAYS = 30;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(requireEnv("AUTH_SECRET"));
}

/**
 * Constant-time string comparison (edge-runtime safe, no node:crypto).
 * Used for the dashboard password, API token, and shopping share token.
 */
export function tokenEquals(candidate: string | undefined | null, expected: string | undefined): boolean {
  if (!candidate || !expected) return false;
  const a = new TextEncoder().encode(candidate);
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a[i % a.length] ?? 0) ^ (b[i % b.length] ?? 0);
  }
  return diff === 0;
}

export function checkPassword(candidate: string): boolean {
  return tokenEquals(candidate, env("DASHBOARD_PASSWORD"));
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey());
    return true;
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  };
}
