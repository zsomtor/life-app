import { z } from "zod";
import { getRepos } from "../repos";
import type { Idea, IdeaStatus, Repos } from "../repos/types";
import { createTask } from "./tasks";
import { addShoppingItem } from "./shopping";

export const ideaCreateSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export async function listIdeas(
  filter?: { status?: IdeaStatus },
  repos: Repos = getRepos()
): Promise<Idea[]> {
  return repos.ideas.list(filter);
}

export async function addIdea(
  input: z.infer<typeof ideaCreateSchema>,
  repos: Repos = getRepos()
): Promise<Idea> {
  const data = ideaCreateSchema.parse(input);
  return repos.ideas.create(data);
}

export async function archiveIdea(id: string, repos: Repos = getRepos()): Promise<Idea | null> {
  return repos.ideas.update(id, { status: "archived", resolvedAt: new Date().toISOString() });
}

export async function restoreIdea(id: string, repos: Repos = getRepos()): Promise<Idea | null> {
  return repos.ideas.update(id, { status: "inbox", resolvedAt: null, convertedToId: null });
}

export async function deleteIdea(id: string, repos: Repos = getRepos()): Promise<boolean> {
  return repos.ideas.delete(id);
}

/** Convert an inbox idea into a personal task; idea is kept, marked converted. */
export async function convertIdeaToTask(id: string, repos: Repos = getRepos()): Promise<Idea | null> {
  const idea = await repos.ideas.get(id);
  if (!idea) return null;
  // First line becomes the title; the rest goes to notes.
  const [title, ...rest] = idea.content.split("\n");
  const task = await createTask(
    { title: title.slice(0, 500), notes: rest.join("\n").trim() || null },
    repos
  );
  return repos.ideas.update(id, {
    status: "converted_task",
    resolvedAt: new Date().toISOString(),
    convertedToId: task.id,
  });
}

/** Convert an inbox idea into a shopping item; idea is kept, marked converted. */
export async function convertIdeaToShopping(
  id: string,
  repos: Repos = getRepos()
): Promise<Idea | null> {
  const idea = await repos.ideas.get(id);
  if (!idea) return null;
  const item = await addShoppingItem({ name: idea.content.split("\n")[0].slice(0, 300) }, repos);
  return repos.ideas.update(id, {
    status: "converted_shopping",
    resolvedAt: new Date().toISOString(),
    convertedToId: item.id,
  });
}

export async function inboxCount(repos: Repos = getRepos()): Promise<number> {
  return repos.ideas.countInbox();
}
