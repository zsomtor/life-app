import { env, flag } from "../env";

/**
 * PHASE 2 — stats cards. Scaffolding only; both providers are feature-flagged
 * and return { enabled: false } until configured. The /api/v1/stats route and
 * a future dashboard card consume this shape, so enabling a provider later
 * requires no API/UI contract changes.
 */

export type StatValue = { enabled: boolean; value?: number; label: string; note?: string };

/**
 * PHASE 2: Newsletter subscriber count via the MailerLite API (free tier).
 * Enable with STATS_NEWSLETTER_ENABLED=true + MAILERLITE_API_KEY.
 * Implementation sketch: GET https://connect.mailerlite.com/api/subscribers?limit=0
 * with `Authorization: Bearer <key>` returns { total: number } meta.
 */
export async function getNewsletterSubscribers(): Promise<StatValue> {
  const label = "Newsletter subscribers";
  if (!flag("STATS_NEWSLETTER_ENABLED") || !env("MAILERLITE_API_KEY")) {
    return { enabled: false, label, note: "Set STATS_NEWSLETTER_ENABLED + MAILERLITE_API_KEY" };
  }
  const res = await fetch("https://connect.mailerlite.com/api/subscribers?limit=0", {
    headers: { authorization: `Bearer ${env("MAILERLITE_API_KEY")}` },
  });
  if (!res.ok) throw new Error(`MailerLite failed: ${res.status}`);
  const data = (await res.json()) as { total?: number; meta?: { total?: number } };
  return { enabled: true, label, value: data.total ?? data.meta?.total ?? 0 };
}

// Note: YouTube video stats moved out of Phase 2 — they now come live from the
// BAZU analytics Google Sheet (see analytics-sheet.ts). The YouTube Analytics
// API route is no longer planned unless per-day view deltas are needed.
