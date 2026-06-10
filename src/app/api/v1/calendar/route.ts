import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { getEventsForRange } from "@/lib/integrations/calendar";

export const GET = withApiAuth(async (req) => {
  const range = new URL(req.url).searchParams.get("range") === "week" ? "week" : "today";
  return NextResponse.json(await getEventsForRange(range));
});
