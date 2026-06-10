import { NextResponse } from "next/server";
import { badRequest, withApiAuth } from "@/lib/api-auth";
import { addTeamTask, getTeamTasks, teamTasksConfigured } from "@/lib/integrations/team-tasks";

export const GET = withApiAuth(async () => {
  if (!teamTasksConfigured()) {
    return NextResponse.json({ configured: false, tasks: [] });
  }
  return NextResponse.json({ configured: true, tasks: await getTeamTasks() });
});

export const POST = withApiAuth(async (req) => {
  if (!teamTasksConfigured()) return badRequest("Team tasks API is not configured");
  const task = await addTeamTask(await req.json());
  return NextResponse.json({ task }, { status: 201 });
});
