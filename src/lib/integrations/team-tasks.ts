import { z } from "zod";
import { env } from "../env";

/**
 * Client for the BAZU team task manager REST API (Next.js app on Vercel).
 * TEAM_TASKS_API_URL points at the tasks collection endpoint, e.g.
 *   https://bazu-task-manager.vercel.app/api/tasks
 * Contract:
 *   GET  -> open tasks (array, or an object grouped by assignee name)
 *   POST -> { title, description?, assigned_to, assigned_phone?, due_date, priority }
 *   complete -> POST {url}/{id}/complete, with PATCH {url}/{id} {status:"done"} fallback
 */

export type TeamTask = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  due_date: string | null;
  priority: "ASAP" | "High" | "Medium" | "Low" | string;
  status: string;
  created_at: string | null;
  co_assignees: string[] | null;
};

export const TEAM_MEMBERS = ["Zsomtor", "Kazu", "Bálint", "Tamás"] as const;

export const teamTaskCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).nullish(),
  assigned_to: z.string().trim().min(1),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(["ASAP", "High", "Medium", "Low"]).default("Medium"),
});

export function teamTasksConfigured(): boolean {
  return Boolean(env("TEAM_TASKS_API_URL"));
}

function baseUrl(): string {
  const url = env("TEAM_TASKS_API_URL");
  if (!url) throw new TeamTasksNotConfiguredError();
  return url.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  const token = env("TEAM_TASKS_API_TOKEN");
  if (token) h["authorization"] = `Bearer ${token}`;
  return h;
}

export class TeamTasksNotConfiguredError extends Error {
  constructor() {
    super("TEAM_TASKS_API_URL is not configured");
  }
}

/** Optional name -> phone map (JSON in env), if the API requires assigned_phone. */
function phoneFor(name: string): string | undefined {
  const raw = env("TEAM_PHONE_MAP");
  if (!raw) return undefined;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[name];
  } catch {
    return undefined;
  }
}

function normalize(raw: unknown): TeamTask[] {
  // Accept either a flat array or the MCP-style { "Name": [tasks...] } grouping.
  const items: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, unknown>).flatMap((v) => (Array.isArray(v) ? v : []))
      : [];
  return items
    .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === "object")
    .map((t) => ({
      id: String(t.id ?? ""),
      title: String(t.title ?? ""),
      description: (t.description as string | null) ?? null,
      assigned_to: String(t.assigned_to ?? ""),
      due_date: (t.due_date as string | null) ?? null,
      priority: String(t.priority ?? "Medium"),
      status: String(t.status ?? "open"),
      created_at: (t.created_at as string | null) ?? null,
      co_assignees: (t.co_assignees as string[] | null) ?? null,
    }));
}

export async function getTeamTasks(): Promise<TeamTask[]> {
  const res = await fetch(baseUrl(), { headers: headers(), next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Team tasks API GET failed: ${res.status}`);
  return normalize(await res.json());
}

export async function addTeamTask(
  input: z.infer<typeof teamTaskCreateSchema>
): Promise<TeamTask | null> {
  const data = teamTaskCreateSchema.parse(input);
  const body: Record<string, unknown> = { ...data, description: data.description ?? null };
  const phone = phoneFor(data.assigned_to);
  if (phone) body.assigned_phone = phone;

  const res = await fetch(baseUrl(), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Team tasks API POST failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const created = await res.json().catch(() => null);
  const normalized = created ? normalize([created]) : [];
  return normalized[0] ?? null;
}

export async function completeTeamTask(id: string): Promise<void> {
  const safeId = encodeURIComponent(id);
  // Preferred shape; fall back to PATCH for older deployments of the API.
  let res = await fetch(`${baseUrl()}/${safeId}/complete`, { method: "POST", headers: headers() });
  if (res.status === 404 || res.status === 405) {
    res = await fetch(`${baseUrl()}/${safeId}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "done" }),
    });
  }
  if (!res.ok) throw new Error(`Team tasks API complete failed: ${res.status}`);
}
