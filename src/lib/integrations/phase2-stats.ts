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

/**
 * PHASE 2: YouTube monthly views, long-form only.
 * Needs the YouTube Analytics API (OAuth as channel owner) for per-video
 * monthly views, joined with video durations from the YouTube Data API to
 * filter out Shorts (< 60s). All free, but requires its own OAuth consent
 * setup — see README "Phase 2" for the click-by-click steps.
 * Enable with STATS_YOUTUBE_ENABLED=true + YOUTUBE_CLIENT_ID,
 * YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN, YOUTUBE_CHANNEL_ID.
 */
export async function getYoutubeMonthlyLongformViews(): Promise<StatValue> {
  const label = "YouTube monthly views (long-form)";
  if (!flag("STATS_YOUTUBE_ENABLED")) {
    return { enabled: false, label, note: "Set STATS_YOUTUBE_ENABLED + YOUTUBE_* env vars" };
  }
  // PHASE 2: implement
  //  1. refresh access token (same flow as google-calendar.ts, youtube scopes)
  //  2. youtubeAnalytics.reports.query: dimensions=video, metrics=views,
  //     startDate=first of month, endDate=today, sort=-views
  //  3. videos.list(part=contentDetails) for durations; drop ISO8601 < 60s
  //  4. sum remaining views
  return { enabled: false, label, note: "Not implemented yet (Phase 2)" };
}
