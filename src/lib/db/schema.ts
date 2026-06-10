import { boolean, date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const taskCategories = pgTable("task_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: date("due_date"),
  done: boolean("done").notNull().default(false),
  // Null = the default "General" column.
  categoryId: uuid("category_id").references(() => taskCategories.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Set when the task was pushed to the team task manager.
  sentToTeamAt: timestamp("sent_to_team_at", { withTimezone: true }),
  teamTaskId: text("team_task_id"),
});

export const shoppingItems = pgTable("shopping_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  quantity: text("quantity"),
  checked: boolean("checked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
});

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  // inbox | archived | converted_task | converted_shopping
  status: text("status").notNull().default("inbox"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  convertedToId: uuid("converted_to_id"),
});
