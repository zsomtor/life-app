"use client";

import { useState } from "react";
import type { Task } from "@/lib/repos/types";
import { api, broadcastRefresh, useApi } from "./useApi";
import { Card, CheckCircle, CountBadge, Empty, ErrorNote, IconButton, Loading, inputCls } from "./ui";

function dueTone(due: string | null, today: string): string {
  if (!due) return "text-dim";
  if (due < today) return "text-danger";
  if (due === today) return "text-warn";
  return "text-dim";
}

export function TasksCard({ today }: { today: string }) {
  const [showDone, setShowDone] = useState(false);
  const { data, error, loading } = useApi<{ tasks: Task[] }>("/api/v1/tasks", 30_000);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
      broadcastRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const addTask = () =>
    run(async () => {
      if (!title.trim() || busy) return;
      setBusy(true);
      try {
        await api("/api/v1/tasks", "POST", { title, dueDate: due || null });
        setTitle("");
        setDue("");
      } finally {
        setBusy(false);
      }
    });

  const tasks = (data?.tasks ?? []).filter((t) => (showDone ? t.done : !t.done));

  return (
    <Card
      title="My tasks"
      badge={data ? <CountBadge n={data.tasks.filter((t) => !t.done).length} /> : undefined}
      action={
        <button
          type="button"
          onClick={() => setShowDone((v) => !v)}
          className="text-[12px] text-dim transition-colors hover:text-ink"
        >
          {showDone ? "open ↩" : "done ✓"}
        </button>
      }
    >
      <form
        className="mb-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className={`${inputCls} min-w-0 flex-1`}
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
          className={`${inputCls} shrink-0 font-mono text-[12px]`}
        />
        {/* keeps Enter-to-submit working: forms with 2+ fields need a submit button */}
        <button type="submit" hidden aria-hidden />
      </form>
      {actionError && <ErrorNote message={actionError} />}
      {loading && !data ? (
        <Loading />
      ) : error && !data ? (
        <ErrorNote message={error} />
      ) : tasks.length === 0 ? (
        <Empty label={showDone ? "Nothing completed yet." : "All clear. Add something above."} />
      ) : (
        <ul className="divide-y divide-line/60">
          {tasks.map((t) => (
            <li key={t.id} className="group flex items-center gap-2.5 py-1.5">
              <CheckCircle
                checked={t.done}
                label={`complete ${t.title}`}
                onChange={(done) => run(() => api(`/api/v1/tasks/${t.id}`, "PATCH", { done }))}
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[13.5px] ${t.done ? "text-dim line-through" : ""}`}>
                  {t.title}
                </p>
                {t.notes && <p className="truncate text-[12px] text-dim">{t.notes}</p>}
              </div>
              {t.dueDate && (
                <span className={`font-mono text-[11.5px] ${dueTone(t.dueDate, today)}`}>
                  {t.dueDate.slice(5)}
                </span>
              )}
              {t.sentToTeamAt ? (
                <span className="text-[11px] text-ok/80" title="Sent to team">
                  ⇡ team
                </span>
              ) : (
                !t.done && (
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">
                    <IconButton
                      label="Push to team list"
                      tone="acc"
                      onClick={() => run(() => api(`/api/v1/tasks/${t.id}/promote`, "POST", {}))}
                    >
                      ⇡ team
                    </IconButton>
                  </span>
                )
              )}
              <span className="opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton
                  label="Delete task"
                  tone="danger"
                  onClick={() => run(() => api(`/api/v1/tasks/${t.id}`, "DELETE"))}
                >
                  ✕
                </IconButton>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
