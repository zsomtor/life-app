import { env } from "../env";
import { googleAccessToken, googleConfigured } from "./google-auth";

/**
 * Video stats from the BAZU analytics Google Sheet (the data source behind
 * bazu-analytics.vercel.app). Read-only via the Sheets API v4, reusing the
 * same Google OAuth refresh token as the calendar (needs the
 * spreadsheets.readonly scope when minting — see README).
 *
 * Sheet columns (first tab):
 *   ID | GUEST(title) | LINK | Posztolás napja | CTR 24H | CTR 2D | CTR 5D |
 *   CTR 7D | CTR 14D | CTR 30D | AVD | APV | LENGTH | views | type
 * type: PODCAST / UTCAI / DIAL = long-form, SHORT = shorts.
 */

export type VideoStat = {
  title: string;
  url: string;
  publishedAt: string | null; // YYYY-MM-DD
  views: number | null;
  /** Latest available CTR (30D preferred, else the most recent filled column). */
  ctr: string | null;
  avgViewDuration: string | null;
  avgPercentViewed: string | null;
  length: string | null;
  type: string;
  isShort: boolean;
};

export function videoStatsConfigured(): boolean {
  return googleConfigured() && Boolean(env("ANALYTICS_SHEET_ID"));
}

/** "2026.03.19." -> "2026-03-19" */
function parseHuDate(raw: string | undefined): string | null {
  const m = raw?.trim().match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function parseViews(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[\s,.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseSheetRows(rows: string[][]): VideoStat[] {
  const videos: VideoStat[] = [];
  for (const row of rows) {
    const [, title, link, date, ctr24, ctr2, ctr5, ctr7, ctr14, ctr30, avd, apv, length, views, type] =
      row.map((c) => (typeof c === "string" ? c.trim() : c));
    if (!title || !link?.includes("youtu")) continue; // header/section/blank rows
    const typeNorm = (type ?? "").toUpperCase();
    videos.push({
      title,
      url: link,
      publishedAt: parseHuDate(date),
      views: parseViews(views),
      ctr: ctr30 || ctr14 || ctr7 || ctr5 || ctr2 || ctr24 || null,
      avgViewDuration: avd || null,
      avgPercentViewed: apv || null,
      length: length || null,
      type: typeNorm || "UNKNOWN",
      isShort: typeNorm === "SHORT",
    });
  }
  return videos;
}

let cache: { at: number; videos: VideoStat[] } | null = null;
const CACHE_MS = 5 * 60_000;

export async function getVideoStats(): Promise<VideoStat[]> {
  if (!videoStatsConfigured()) return [];
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.videos;

  const sheetId = env("ANALYTICS_SHEET_ID")!;
  const range = encodeURIComponent(env("ANALYTICS_SHEET_RANGE") ?? "A:O");
  const token = await googleAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
    { headers: { authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sheets API failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  const videos = parseSheetRows(data.values ?? []);
  cache = { at: Date.now(), videos };
  return videos;
}

export type VideoSummary = ReturnType<typeof summarizeVideos>;

/** Compact rollup for the briefing and the stats card. */
export function summarizeVideos(videos: VideoStat[], today: string) {
  const dated = videos.filter((v) => v.publishedAt);
  const longform = videos.filter((v) => !v.isShort);
  const shorts = videos.filter((v) => v.isShort);
  const cutoff30 = new Date(new Date(`${today}T00:00:00Z`).getTime() - 30 * 86400_000)
    .toISOString()
    .slice(0, 10);

  const recent = dated
    .filter((v) => v.publishedAt! >= cutoff30)
    .sort((a, b) => b.publishedAt!.localeCompare(a.publishedAt!));
  const sumViews = (list: VideoStat[]) => list.reduce((s, v) => s + (v.views ?? 0), 0);

  return {
    videoCount: videos.length,
    longform: { count: longform.length, totalViews: sumViews(longform) },
    shorts: { count: shorts.length, totalViews: sumViews(shorts) },
    // Cumulative views of videos *published* in the last 30 days
    // (the sheet stores totals per video, not daily deltas).
    publishedLast30Days: {
      count: recent.length,
      longformViews: sumViews(recent.filter((v) => !v.isShort)),
      shortViews: sumViews(recent.filter((v) => v.isShort)),
      videos: recent.slice(0, 10),
    },
    topAllTime: [...videos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
  };
}
