import { NextResponse } from "next/server";
import { badRequest, withApiAuth } from "@/lib/api-auth";
import { completeTeamTask, teamTasksConfigured } from "@/lib/integrations/team-tasks";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApiAuth<Ctx>(async (_req, ctx) => {
  if (!teamTasksConfigured()) return badRequest("Team tasks API is not configured");
  const { id } = await ctx.params;
  await completeTeamTask(id);
  return NextResponse.json({ ok: true });
});
