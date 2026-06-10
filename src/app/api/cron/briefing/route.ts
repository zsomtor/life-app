import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { tokenEquals } from "@/lib/auth";
import { getTodayBriefing } from "@/lib/services/briefing";
import { briefingEmailEnabled, composeBriefing, sendBriefingEmail } from "@/lib/integrations/mailer";

export const maxDuration = 60;

/**
 * Daily briefing cron (see vercel.json). Vercel calls this with
 * `Authorization: Bearer ${CRON_SECRET}`; the dashboard API token works too,
 * so the Claude copilot or a home-server scheduler can trigger it manually.
 * No-ops (but reports why) unless BRIEFING_EMAIL_ENABLED is on.
 */
export async function GET(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const allowed =
    tokenEquals(bearer, env("CRON_SECRET")) || tokenEquals(bearer, env("DASHBOARD_API_TOKEN"));
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!briefingEmailEnabled()) {
    return NextResponse.json({
      sent: false,
      reason:
        "Briefing email disabled. Set BRIEFING_EMAIL_ENABLED=true, MAILER_RESEND_API_KEY and BRIEFING_TO_EMAIL to enable the fallback sender.",
    });
  }

  const briefing = await getTodayBriefing();
  const composed = await composeBriefing(briefing);
  await sendBriefingEmail(composed);
  return NextResponse.json({ sent: true, date: briefing.date, errors: briefing.errors });
}
