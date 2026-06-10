import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { getTodayBriefing } from "@/lib/services/briefing";

export const GET = withApiAuth(async () => {
  return NextResponse.json(await getTodayBriefing());
});
