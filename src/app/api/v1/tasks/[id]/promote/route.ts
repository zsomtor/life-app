import { NextResponse } from "next/server";
import { badRequest, notFound, withApiAuth } from "@/lib/api-auth";
import { getRepos } from "@/lib/repos";
import { markTaskSentToTeam } from "@/lib/services/tasks";
import {
  addTeamTask,
  TeamTasksNotConfiguredError,
  teamTasksConfigured,
} from "@/lib/integrations/team-tasks";
import { todayString } from "@/lib/time";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Push a personal task to the team task manager.
 * Body (optional): { assigned_to?, due_date?, priority? } — defaults:
 * assigned to me (Zsomtor), due = task's dueDate or today, priority Medium.
 */
export const POST = withApiAuth<Ctx>(async (req, ctx) => {
  if (!teamTasksConfigured()) return badRequest("Team tasks API is not configured");
  const { id } = await ctx.params;
  const task = await getRepos().tasks.get(id);
  if (!task) return notFound();

  const body = await req.json().catch(() => ({}));
  try {
    const created = await addTeamTask({
      title: task.title,
      description: task.notes,
      assigned_to: body.assigned_to ?? "Zsomtor",
      due_date: body.due_date ?? task.dueDate ?? todayString(),
      priority: body.priority ?? "Medium",
    });
    const updated = await markTaskSentToTeam(id, created?.id ?? null);
    return NextResponse.json({ task: updated, teamTask: created });
  } catch (err) {
    if (err instanceof TeamTasksNotConfiguredError) return badRequest(err.message);
    throw err;
  }
});
