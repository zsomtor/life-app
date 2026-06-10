import { randomUUID } from "crypto";
import type { Idea, IdeaStatus, Repos, ShoppingItem, Task } from "./types";

/**
 * In-memory repos. Used for tests and as a zero-config dev fallback when
 * DATABASE_URL isn't set. Data does not survive restarts — a warning is
 * logged when this driver is selected in dev.
 */
export function createMemoryRepos(): Repos {
  const tasks = new Map<string, Task>();
  const shopping = new Map<string, ShoppingItem>();
  const ideas = new Map<string, Idea>();

  const byNewest = <T extends { createdAt: string }>(a: T, b: T) =>
    b.createdAt.localeCompare(a.createdAt);

  return {
    tasks: {
      async list(filter) {
        let all = [...tasks.values()];
        if (filter?.done !== undefined) all = all.filter((t) => t.done === filter.done);
        if (filter?.dueOnOrBefore)
          all = all.filter((t) => t.dueDate !== null && t.dueDate <= filter.dueOnOrBefore!);
        return all.sort(byNewest);
      },
      async get(id) {
        return tasks.get(id) ?? null;
      },
      async create(data) {
        const task: Task = {
          id: randomUUID(),
          title: data.title,
          notes: data.notes ?? null,
          dueDate: data.dueDate ?? null,
          done: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
          sentToTeamAt: null,
          teamTaskId: null,
        };
        tasks.set(task.id, task);
        return task;
      },
      async update(id, patch) {
        const cur = tasks.get(id);
        if (!cur) return null;
        const next = { ...cur, ...patch };
        tasks.set(id, next);
        return next;
      },
      async delete(id) {
        return tasks.delete(id);
      },
    },

    shopping: {
      async list() {
        return [...shopping.values()].sort(byNewest);
      },
      async get(id) {
        return shopping.get(id) ?? null;
      },
      async create(data) {
        const item: ShoppingItem = {
          id: randomUUID(),
          name: data.name,
          quantity: data.quantity ?? null,
          checked: false,
          createdAt: new Date().toISOString(),
          checkedAt: null,
        };
        shopping.set(item.id, item);
        return item;
      },
      async update(id, patch) {
        const cur = shopping.get(id);
        if (!cur) return null;
        const next = { ...cur, ...patch };
        shopping.set(id, next);
        return next;
      },
      async delete(id) {
        return shopping.delete(id);
      },
    },

    ideas: {
      async list(filter) {
        let all = [...ideas.values()];
        if (filter?.status) all = all.filter((i) => i.status === filter.status);
        return all.sort(byNewest);
      },
      async get(id) {
        return ideas.get(id) ?? null;
      },
      async create(data) {
        const idea: Idea = {
          id: randomUUID(),
          content: data.content,
          status: "inbox" as IdeaStatus,
          createdAt: new Date().toISOString(),
          resolvedAt: null,
          convertedToId: null,
        };
        ideas.set(idea.id, idea);
        return idea;
      },
      async update(id, patch) {
        const cur = ideas.get(id);
        if (!cur) return null;
        const next = { ...cur, ...patch };
        ideas.set(id, next);
        return next;
      },
      async delete(id) {
        return ideas.delete(id);
      },
      async countInbox() {
        return [...ideas.values()].filter((i) => i.status === "inbox").length;
      },
    },
  };
}
