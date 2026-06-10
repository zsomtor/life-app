import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

/**
 * Guards dashboard pages. API routes (/api/*) and the public shopping share
 * page (/shopping/<token>) do their own auth, so they are excluded here.
 */
export async function middleware(req: NextRequest) {
  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!ok) {
    const login = new URL("/login", req.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except: login, api, public shopping share, next internals, static files.
    "/((?!login|api|shopping/|_next|favicon.ico|icon|apple-icon|manifest|.*\\.(?:svg|png|jpg|webmanifest)).*)",
  ],
};
