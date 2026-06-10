import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import {
  getNewsletterSubscribers,
  getYoutubeMonthlyLongformViews,
} from "@/lib/integrations/phase2-stats";

/** PHASE 2 hook — returns disabled placeholders until providers are configured. */
export const GET = withApiAuth(async () => {
  const [newsletter, youtube] = await Promise.allSettled([
    getNewsletterSubscribers(),
    getYoutubeMonthlyLongformViews(),
  ]);
  return NextResponse.json({
    newsletter:
      newsletter.status === "fulfilled"
        ? newsletter.value
        : { enabled: true, label: "Newsletter subscribers", note: String(newsletter.reason) },
    youtube:
      youtube.status === "fulfilled"
        ? youtube.value
        : { enabled: true, label: "YouTube monthly views (long-form)", note: String(youtube.reason) },
  });
});
