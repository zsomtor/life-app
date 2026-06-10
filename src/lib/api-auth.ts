import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "./env";
import { SESSION_COOKIE, tokenEquals, verifySessionToken } from "./auth";

/**
 * API authentication: accepts either
 *  - the owner's browser session cookie (web UI), or
 *  - `Authorization: Bearer <DASHBOARD_API_TOKEN>` / `?token=` (Claude/MCP/scripts).
 */
export async function isApiAuthorized(req: Request): Promise<boolean> {
  const apiToken = env("DASHBOARD_API_TOKEN");
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ") && tokenEquals(header.slice(7).trim(), apiToken)) {
    return true;
  }
  const queryToken = new URL(req.url).searchParams.get("token");
  if (queryToken && tokenEquals(queryToken, apiToken)) return true;

  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Wraps a handler with auth + uniform error handling. */
export function withApiAuth<Ctx>(
  handler: (req: Request, ctx: Ctx) => Promise<NextResponse>
): (req: Request, ctx: Ctx) => Promise<NextResponse> {
  return async (req, ctx) => {
    if (!(await isApiAuthorized(req))) return unauthorized();
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err && typeof err === "object" && "issues" in err) {
        // zod validation error
        return badRequest(JSON.stringify((err as { issues: unknown }).issues));
      }
      console.error("[api]", err);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  };
}
