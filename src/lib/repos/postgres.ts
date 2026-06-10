import { and, eq, lte, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { ideas, shoppingItems, taskCategories, tasks } from "../db/schema";
import type { Idea, IdeaStatus, Repos, ShoppingItem, Task, TaskCategory } from "./types";

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

function rowToTask(r: typeof tasks.$inferSelect): Task {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes,
    dueDate: r.dueDate,
    done: r.done,
    categoryId: r.categoryId,
    createdAt: r.createdAt.toISOString(),
    completedAt: iso(r.completedAt),
    sentToTeamAt: iso(r.sentToTeamAt),
    teamTaskId: r.teamTaskId,
  };
}

function rowToItem(r: typeof shoppingItems.$inferSelect): ShoppingItem {
  return {
    id: r.id,
    name: r.name,
    quantity: r.quantity,
    checked: r.checked,
    createdAt: r.createdAt.toISOString(),
    checkedAt: iso(r.checkedAt),
  };
}

function rowToIdea(r: typeof ideas.$inferSelect): Idea {
  return {
    id: r.id,
    content: r.content,
    status: r.status as IdeaStatus,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: iso(r.resolvedAt),
    convertedToId: r.convertedToId,
  };
}

function rowToCategory(r: typeof taskCategories.$inferSelect): TaskCategory {
  return {
    id: r.id,
    name: r.name,
    position: r.position,
    createdAt: r.createdAt.toISOString(),
  };
}

const toDate = (v: string | null | undefined): Date | null | undefined =>
  v === undefined ? undefined : v === null ? null : new Date(v);

export function createPostgresRepos(): Repos {
  return {
    tasks: {
      async list(filter) {
        const db = getDb();
        const conds = [];
        if (filter?.done !== undefined) conds.push(eq(tasks.done, filter.done));
        if (filter?.dueOnOrBefore) conds.push(lte(tasks.dueDate, filter.dueOnOrBefore));
        const rows = await db
          .select()
          .from(tasks)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(sql`${tasks.createdAt} desc`);
        return rows.map(rowToTask);
      },
      async get(id) {
        const rows = await getDb().select().from(tasks).where(eq(tasks.id, id)).limit(1);
        return rows[0] ? rowToTask(rows[0]) : null;
      },
      async create(data) {
        const rows = await getDb()
          .insert(tasks)
          .values({
            title: data.title,
            notes: data.notes ?? null,
            dueDate: data.dueDate ?? null,
            categoryId: data.categoryId ?? null,
          })
          .returning();
        return rowToTask(rows[0]);
      },
      async update(id, patch) {
        const rows = await getDb()
          .update(tasks)
          .set({
            title: patch.title,
            notes: patch.notes,
            dueDate: patch.dueDate,
            done: patch.done,
            categoryId: patch.categoryId,
            completedAt: toDate(patch.completedAt),
            sentToTeamAt: toDate(patch.sentToTeamAt),
            teamTaskId: patch.teamTaskId,
          })
          .where(eq(tasks.id, id))
          .returning();
        return rows[0] ? rowToTask(rows[0]) : null;
      },
      async delete(id) {
        const rows = await getDb().delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
        return rows.length > 0;
      },
    },

    categories: {
      async list() {
        const rows = await getDb()
          .select()
          .from(taskCategories)
          .orderBy(sql`${taskCategories.position} asc, ${taskCategories.createdAt} asc`);
        return rows.map(rowToCategory);
      },
      async get(id) {
        const rows = await getDb().select().from(taskCategories).where(eq(taskCategories.id, id)).limit(1);
        return rows[0] ? rowToCategory(rows[0]) : null;
      },
      async create(data) {
        const rows = await getDb()
          .insert(taskCategories)
          .values({ name: data.name, position: data.position ?? 0 })
          .returning();
        return rowToCategory(rows[0]);
      },
      async update(id, patch) {
        const rows = await getDb()
          .update(taskCategories)
          .set({ name: patch.name, position: patch.position })
          .where(eq(taskCategories.id, id))
          .returning();
        return rows[0] ? rowToCategory(rows[0]) : null;
      },
      async delete(id) {
        // FK has ON DELETE SET NULL, so tasks fall back to the default column.
        const rows = await getDb()
          .delete(taskCategories)
          .where(eq(taskCategories.id, id))
          .returning({ id: taskCategories.id });
        return rows.length > 0;
      },
    },

    shopping: {
      async list() {
        const rows = await getDb()
          .select()
          .from(shoppingItems)
          .orderBy(sql`${shoppingItems.createdAt} desc`);
        return rows.map(rowToItem);
      },
      async get(id) {
        const rows = await getDb().select().from(shoppingItems).where(eq(shoppingItems.id, id)).limit(1);
        return rows[0] ? rowToItem(rows[0]) : null;
      },
      async create(data) {
        const rows = await getDb()
          .insert(shoppingItems)
          .values({ name: data.name, quantity: data.quantity ?? null })
          .returning();
        return rowToItem(rows[0]);
      },
      async update(id, patch) {
        const rows = await getDb()
          .update(shoppingItems)
          .set({
            name: patch.name,
            quantity: patch.quantity,
            checked: patch.checked,
            checkedAt: toDate(patch.checkedAt),
          })
          .where(eq(shoppingItems.id, id))
          .returning();
        return rows[0] ? rowToItem(rows[0]) : null;
      },
      async delete(id) {
        const rows = await getDb()
          .delete(shoppingItems)
          .where(eq(shoppingItems.id, id))
          .returning({ id: shoppingItems.id });
        return rows.length > 0;
      },
    },

    ideas: {
      async list(filter) {
        const db = getDb();
        const rows = await db
          .select()
          .from(ideas)
          .where(filter?.status ? eq(ideas.status, filter.status) : undefined)
          .orderBy(sql`${ideas.createdAt} desc`);
        return rows.map(rowToIdea);
      },
      async get(id) {
        const rows = await getDb().select().from(ideas).where(eq(ideas.id, id)).limit(1);
        return rows[0] ? rowToIdea(rows[0]) : null;
      },
      async create(data) {
        const rows = await getDb().insert(ideas).values({ content: data.content }).returning();
        return rowToIdea(rows[0]);
      },
      async update(id, patch) {
        const rows = await getDb()
          .update(ideas)
          .set({
            content: patch.content,
            status: patch.status,
            resolvedAt: toDate(patch.resolvedAt),
            convertedToId: patch.convertedToId,
          })
          .where(eq(ideas.id, id))
          .returning();
        return rows[0] ? rowToIdea(rows[0]) : null;
      },
      async delete(id) {
        const rows = await getDb().delete(ideas).where(eq(ideas.id, id)).returning({ id: ideas.id });
        return rows.length > 0;
      },
      async countInbox() {
        const rows = await getDb()
          .select({ n: sql<number>`count(*)::int` })
          .from(ideas)
          .where(eq(ideas.status, "inbox"));
        return rows[0]?.n ?? 0;
      },
    },
  };
}
