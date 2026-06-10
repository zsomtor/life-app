import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { env } from "@/lib/env";
import { tokenEquals } from "@/lib/auth";
import { todayString } from "@/lib/time";
import { createTask, listTasks, updateTask } from "@/lib/services/tasks";
import { addShoppingItem, listShopping, updateShoppingItem } from "@/lib/services/shopping";
import { addIdea, listIdeas } from "@/lib/services/ideas";
import { getTodayBriefing } from "@/lib/services/briefing";
import {
  addTeamTask,
  completeTeamTask,
  getTeamTasks,
  teamTasksConfigured,
} from "@/lib/integrations/team-tasks";

/**
 * MCP server — the dashboard's second client (the web UI being the first).
 * Streamable HTTP at /api/mcp. Auth: Authorization: Bearer <DASHBOARD_API_TOKEN>
 * or ?token=<DASHBOARD_API_TOKEN> for clients that can't set headers
 * (claude.ai custom connectors). Same services, same live data as the UI.
 */

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "get_tasks",
      "Get personal tasks from the life dashboard. Defaults to open tasks; pass include_done=true for completed ones too.",
      { include_done: z.boolean().optional() },
      async ({ include_done }) => {
        const tasks = await listTasks(include_done ? undefined : { done: false });
        return json({ today: todayString(), tasks });
      }
    );

    server.tool(
      "add_task",
      "Add a personal task to the life dashboard.",
      {
        title: z.string().min(1),
        notes: z.string().optional(),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      },
      async ({ title, notes, due_date }) => {
        const task = await createTask({ title, notes: notes ?? null, dueDate: due_date ?? null });
        return json({ task });
      }
    );

    server.tool(
      "complete_task",
      "Mark a personal task as done (or not done) by id.",
      { task_id: z.string(), done: z.boolean().optional() },
      async ({ task_id, done }) => {
        const task = await updateTask(task_id, { done: done ?? true });
        return task ? json({ task }) : json({ error: "Task not found" });
      }
    );

    server.tool(
      "get_team_tasks",
      "Get open tasks from the BAZU team task manager (all team members).",
      {},
      async () => {
        if (!teamTasksConfigured()) return json({ configured: false, tasks: [] });
        return json({ configured: true, tasks: await getTeamTasks() });
      }
    );

    server.tool(
      "add_team_task",
      "Add a task to the BAZU team task manager.",
      {
        title: z.string().min(1),
        description: z.string().optional(),
        assigned_to: z.string().describe("Team member: Zsomtor, Kazu, Bálint or Tamás"),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        priority: z.enum(["ASAP", "High", "Medium", "Low"]).optional(),
      },
      async ({ title, description, assigned_to, due_date, priority }) => {
        const task = await addTeamTask({
          title,
          description: description ?? null,
          assigned_to,
          due_date,
          priority: priority ?? "Medium",
        });
        return json({ task });
      }
    );

    server.tool(
      "complete_team_task",
      "Mark a BAZU team task as done by id.",
      { task_id: z.string() },
      async ({ task_id }) => {
        await completeTeamTask(task_id);
        return json({ ok: true });
      }
    );

    server.tool("get_shopping", "Get the shared shopping list.", {}, async () => {
      return json({ items: await listShopping() });
    });

    server.tool(
      "add_shopping_item",
      "Add an item to the shared shopping list.",
      { name: z.string().min(1), quantity: z.string().optional() },
      async ({ name, quantity }) => {
        const item = await addShoppingItem({ name, quantity: quantity ?? null });
        return json({ item });
      }
    );

    server.tool(
      "check_shopping_item",
      "Check (or uncheck) a shopping list item by id.",
      { item_id: z.string(), checked: z.boolean().optional() },
      async ({ item_id, checked }) => {
        const item = await updateShoppingItem(item_id, { checked: checked ?? true });
        return item ? json({ item }) : json({ error: "Item not found" });
      }
    );

    server.tool(
      "add_idea",
      "Capture an idea/note into the dashboard's idea inbox.",
      { content: z.string().min(1) },
      async ({ content }) => {
        const idea = await addIdea({ content });
        return json({ idea });
      }
    );

    server.tool(
      "list_ideas",
      "List ideas from the inbox (default) or another status.",
      { status: z.enum(["inbox", "archived", "converted_task", "converted_shopping"]).optional() },
      async ({ status }) => {
        const ideas = await listIdeas({ status: status ?? "inbox" });
        return json({ ideas });
      }
    );

    server.tool(
      "get_today_briefing",
      "One-call aggregate for the daily briefing: today's personal tasks (due/overdue), team tasks, merged Google+Notion calendar events, and the idea inbox count.",
      {},
      async () => json(await getTodayBriefing())
    );
  },
  {
    serverInfo: { name: "life-dashboard", version: "1.0.0" },
  },
  {
    // Route lives at /api/[transport] -> streamable HTTP endpoint is /api/mcp.
    basePath: "/api",
    disableSse: true,
    verboseLogs: false,
  }
);

function authorized(req: Request): boolean {
  const expected = env("DASHBOARD_API_TOKEN");
  if (!expected) return false;
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ") && tokenEquals(header.slice(7).trim(), expected)) {
    return true;
  }
  return tokenEquals(new URL(req.url).searchParams.get("token"), expected);
}

const guarded = (req: Request) => {
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return handler(req);
};

export { guarded as GET, guarded as POST, guarded as DELETE };
