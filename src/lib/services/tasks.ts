import { z } from "zod";
import { getRepos } from "../repos";
import type { Repos, Task } from "../repos/types";

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(5000).nullish(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .nullish(),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  done: z.boolean().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export async function listTasks(
  filter?: { done?: boolean; dueOnOrBefore?: string },
  repos: Repos = getRepos()
): Promise<Task[]> {
  return repos.tasks.list(filter);
}

export async function createTask(input: TaskCreateInput, repos: Repos = getRepos()): Promise<Task> {
  const data = taskCreateSchema.parse(input);
  return repos.tasks.create(data);
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput,
  repos: Repos = getRepos()
): Promise<Task | null> {
  const patch = taskUpdateSchema.parse(input);
  const existing = await repos.tasks.get(id);
  if (!existing) return null;
  // Completing/uncompleting maintains the completedAt timestamp.
  const completedAt =
    patch.done === undefined || patch.done === existing.done
      ? undefined
      : patch.done
        ? new Date().toISOString()
        : null;
  return repos.tasks.update(id, { ...patch, completedAt });
}

export async function deleteTask(id: string, repos: Repos = getRepos()): Promise<boolean> {
  return repos.tasks.delete(id);
}

/** Mark a personal task as pushed to the team task manager. */
export async function markTaskSentToTeam(
  id: string,
  teamTaskId: string | null,
  repos: Repos = getRepos()
): Promise<Task | null> {
  return repos.tasks.update(id, {
    sentToTeamAt: new Date().toISOString(),
    teamTaskId,
  });
}

/** Tasks for the Today hero: due today, overdue, plus undated open tasks count. */
export async function todayTasks(today: string, repos: Repos = getRepos()) {
  const open = await repos.tasks.list({ done: false });
  return {
    dueToday: open.filter((t) => t.dueDate === today),
    overdue: open.filter((t) => t.dueDate !== null && t.dueDate < today),
    openCount: open.length,
  };
}
