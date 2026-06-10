"use client";

import { useMemo, useState } from "react";
import type { TeamTask } from "@/lib/integrations/team-tasks";
import { api, broadcastRefresh, useApi } from "./useApi";
import { btnCls, Card, CountBadge, Empty, ErrorNote, IconButton, Loading, inputCls } from "./ui";

const MEMBERS = ["Zsomtor", "Kazu", "Bálint", "Tamás"];
const PRIORITIES = ["ASAP", "High", "Medium", "Low"] as const;

const prioTone: Record<string, string> = {
  ASAP: "text-danger",
  High: "text-warn",
  Medium: "text-acc",
  Low: "text-dim",
};

export function TeamTasksCard({ today }: { today: string }) {
  const { data, error, loading } = useApi<{ configured: boolean; tasks: TeamTask[] }>(
    "/api/v1/team-tasks",
    60_000
  );
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("Zsomtor");
  const [due, setDue] = useState(today);
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Medium");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const byAssignee = new Map<string, TeamTask[]>();
    for (const t of data?.tasks ?? []) {
      const list = byAssignee.get(t.assigned_to) ?? [];
      list.push(t);
      byAssignee.set(t.assigned_to, list);
    }
    // Me first, then the rest alphabetically.
    return [...byAssignee.entries()].sort(([a], [b]) =>
      a === "Zsomtor" ? -1 : b === "Zsomtor" ? 1 : a.localeCompare(b)
    );
  }, [data?.tasks]);

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
      broadcastRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const submit = () =>
    run(async () => {
      if (!title.trim() || busy) return;
      setBusy(true);
      try {
        await api("/api/v1/team-tasks", "POST", {
          title,
          assigned_to: assignee,
          due_date: due,
          priority,
        });
        setTitle("");
        setAdding(false);
      } finally {
        setBusy(false);
      }
    });

  return (
    <Card
      title="Team · BAZU"
      badge={data?.configured ? <CountBadge n={data.tasks.length} /> : undefined}
      action={
        data?.configured ? (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="text-[12px] text-dim transition-colors hover:text-acc"
          >
            {adding ? "close" : "+ add"}
          </button>
        ) : undefined
      }
    >
      {adding && (
        <form
          className="mb-3 grid gap-1.5 rounded-lg border border-line bg-panel2/60 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Team task title…"
            className={`${inputCls} w-full`}
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputCls}>
              {MEMBERS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={`${inputCls} font-mono text-[12px]`}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
              className={inputCls}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <button type="submit" disabled={busy || !title.trim()} className={btnCls}>
              Add
            </button>
          </div>
        </form>
      )}
      {actionError && <ErrorNote message={actionError} />}
      {loading && !data ? (
        <Loading />
      ) : error && !data ? (
        <ErrorNote message={error} />
      ) : !data?.configured ? (
        <Empty label="Set TEAM_TASKS_API_URL to connect the BAZU task manager." />
      ) : data.tasks.length === 0 ? (
        <Empty label="No open team tasks. Enjoy it while it lasts." />
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {groups.map(([name, tasks]) => (
            <div key={name}>
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-dim uppercase">
                {name} <span className="font-mono">· {tasks.length}</span>
              </p>
              <ul className="divide-y divide-line/60">
                {tasks.map((t) => (
                  <li key={t.id} className="group flex items-center gap-2 py-1.5">
                    <span className={`font-mono text-[10.5px] ${prioTone[t.priority] ?? "text-dim"}`}>
                      {t.priority === "ASAP" ? "‼" : t.priority[0]}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[13px]" title={t.description ?? t.title}>
                      {t.title}
                    </p>
                    {t.due_date && (
                      <span
                        className={`font-mono text-[11px] ${
                          t.due_date < today ? "text-danger" : t.due_date === today ? "text-warn" : "text-dim"
                        }`}
                      >
                        {t.due_date.slice(5)}
                      </span>
                    )}
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      <IconButton
                        label="Complete team task"
                        tone="ok"
                        onClick={() => run(() => api(`/api/v1/team-tasks/${t.id}/complete`, "POST", {}))}
                      >
                        ✓
                      </IconButton>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
