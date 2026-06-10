import { z } from "zod";
import { getRepos } from "../repos";
import type { Repos, TaskCategory } from "../repos/types";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export async function listCategories(repos: Repos = getRepos()): Promise<TaskCategory[]> {
  return repos.categories.list();
}

/** Create a column; returns the existing one on a case-insensitive name match. */
export async function createCategory(
  input: z.infer<typeof categoryCreateSchema>,
  repos: Repos = getRepos()
): Promise<TaskCategory> {
  const { name } = categoryCreateSchema.parse(input);
  const existing = (await repos.categories.list()).find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing;
  const all = await repos.categories.list();
  return repos.categories.create({ name, position: all.length });
}

export async function renameCategory(
  id: string,
  input: z.infer<typeof categoryCreateSchema>,
  repos: Repos = getRepos()
): Promise<TaskCategory | null> {
  const { name } = categoryCreateSchema.parse(input);
  return repos.categories.update(id, { name });
}

/** Delete a column; its tasks move to the default "General" column. */
export async function deleteCategory(id: string, repos: Repos = getRepos()): Promise<boolean> {
  // The memory driver moves tasks itself; postgres relies on ON DELETE SET NULL.
  return repos.categories.delete(id);
}
