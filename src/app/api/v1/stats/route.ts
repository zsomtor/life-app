import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { getNewsletterSubscribers } from "@/lib/integrations/phase2-stats";
import { getVideoStats, summarizeVideos, videoStatsConfigured } from "@/lib/integrations/analytics-sheet";
import { todayString } from "@/lib/time";

export const GET = withApiAuth(async () => {
  const [newsletter, videos] = await Promise.allSettled([
    getNewsletterSubscribers(),
    videoStatsConfigured() ? getVideoStats() : Promise.resolve([]),
  ]);
  return NextResponse.json({
    newsletter:
      newsletter.status === "fulfilled"
        ? newsletter.value
        : { enabled: true, label: "Newsletter subscribers", note: String(newsletter.reason) },
    videos:
      videos.status === "fulfilled"
        ? {
            enabled: videoStatsConfigured(),
            label: "Video stats (BAZU analytics sheet)",
            ...(videoStatsConfigured() ? summarizeVideos(videos.value, todayString()) : {}),
            ...(videoStatsConfigured()
              ? {}
              : { note: "Set ANALYTICS_SHEET_ID + Google OAuth with spreadsheets.readonly scope" }),
          }
        : { enabled: true, label: "Video stats (BAZU analytics sheet)", note: String(videos.reason) },
  });
});
