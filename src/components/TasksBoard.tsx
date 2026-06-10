"use client";

import { useMemo, useState } from "react";
import type { Task, TaskCategory } from "@/lib/repos/types";
import { api, broadcastRefresh, useApi } from "./useApi";
import { CheckCircle, Empty, ErrorNote, IconButton, Loading, inputCls } from "./ui";

const GENERAL = "__general__";

function dueTone(due: string, today: string): string {
  if (due < today) return "text-danger";
  if (due === today) return "text-warn";
  return "text-dim";
}

function ColumnAdd({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await onAdd(title);
        setTitle("");
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        className={`${inputCls} w-full`}
      />
    </form>
  );
}

function TaskRow({
  task,
  today,
  columns,
  onAction,
}: {
  task: Task;
  today: string;
  columns: { id: string | null; name: string }[];
  onAction: (fn: () => Promise<unknown>) => void;
}) {
  return (
    <li className="group flex items-center gap-2.5 py-2">
      <CheckCircle
        checked={task.done}
        label={`complete ${task.title}`}
        onChange={(done) => onAction(() => api(`/api/v1/tasks/${task.id}`, "PATCH", { done }))}
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13.5px] leading-tight ${task.done ? "text-dim line-through" : ""}`}>
          {task.title}
        </p>
        {task.notes && <p className="truncate text-[12px] text-dim">{task.notes}</p>}
      </div>
      {task.dueDate && (
        <span className={`font-mono text-[11px] ${dueTone(task.dueDate, today)}`}>
          {task.dueDate.slice(5)}
        </span>
      )}
      {task.sentToTeamAt && (
        <span className="text-[10.5px] text-ok/80" title="Sent to the team list">
          ⇡
        </span>
      )}
      <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {/* move to another column */}
        <select
          aria-label="Move to column"
          value={task.categoryId ?? GENERAL}
          onChange={(e) =>
            onAction(() =>
              api(`/api/v1/tasks/${task.id}`, "PATCH", {
                categoryId: e.target.value === GENERAL ? null : e.target.value,
              })
            )
          }
          className="max-w-16 cursor-pointer appearance-none rounded bg-transparent text-[11px] text-dim outline-none hover:text-ink"
        >
          {columns.map((c) => (
            <option key={c.id ?? GENERAL} value={c.id ?? GENERAL} className="bg-panel2 text-ink">
              {c.name}
            </option>
          ))}
        </select>
        {!task.done && !task.sentToTeamAt && (
          <IconButton
            label="Push to team list"
            tone="acc"
            onClick={() => onAction(() => api(`/api/v1/tasks/${task.id}/promote`, "POST", {}))}
          >
            ⇡
          </IconButton>
        )}
        <IconButton
          label="Delete task"
          tone="danger"
          onClick={() => onAction(() => api(`/api/v1/tasks/${task.id}`, "DELETE"))}
        >
          ✕
        </IconButton>
      </span>
    </li>
  );
}

export function TasksBoard({ today }: { today: string }) {
  const tasksApi = useApi<{ tasks: Task[] }>("/api/v1/tasks", 30_000);
  const catsApi = useApi<{ categories: TaskCategory[] }>("/api/v1/categories", 60_000);
  const [showDone, setShowDone] = useState(false);
  const [addingCol, setAddingCol] = useState(false);
  const [colName, setColName] = useState("");
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

  const columns: { id: string | null; name: string }[] = useMemo(
    () => [{ id: null, name: "General" }, ...(catsApi.data?.categories ?? [])],
    [catsApi.data?.categories]
  );

  const allTasks = tasksApi.data?.tasks ?? [];
  const visible = allTasks.filter((t) => (showDone ? t.done : !t.done));
  const byColumn = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of visible) {
      const key = t.categoryId ?? GENERAL;
      m.set(key, [...(m.get(key) ?? []), t]);
    }
    return m;
  }, [visible]);

  const openCount = allTasks.filter((t) => !t.done).length;
  const loading = (tasksApi.loading && !tasksApi.data) || (catsApi.loading && !catsApi.data);
  const error = (tasksApi.error && !tasksApi.data) || (catsApi.error && !catsApi.data);

  return (
    <section className="rise rounded-2xl bg-panel">
      <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          My tasks <span className="font-mono text-[13px] font-medium text-dim">{openCount}</span>
        </h2>
        <div className="flex items-center gap-3 text-[12.5px]">
          {addingCol ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!colName.trim()) return;
                await run(() => api("/api/v1/categories", "POST", { name: colName }));
                setColName("");
                setAddingCol(false);
              }}
            >
              <input
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                placeholder="Column name…"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setAddingCol(false);
                }}
                className={`${inputCls} w-36 py-1 text-[12.5px]`}
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCol(true)}
              className="text-dim transition-colors hover:text-acc"
            >
              + column
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="text-dim transition-colors hover:text-ink"
          >
            {showDone ? "open" : "done"}
          </button>
        </div>
      </header>

      <div className="px-3 pb-3">
        {actionError && <ErrorNote message={actionError} />}
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote message={tasksApi.error ?? catsApi.error ?? "Failed to load"} />
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {columns.map((col) => {
              const colTasks = byColumn.get(col.id ?? GENERAL) ?? [];
              return (
                <div
                  key={col.id ?? GENERAL}
                  className="flex w-72 shrink-0 flex-col rounded-xl bg-panel2/50 p-2.5 sm:flex-1 sm:basis-0"
                >
                  <div className="group/col mb-2 flex items-center justify-between px-0.5">
                    <p className="text-[12.5px] font-semibold text-mut">
                      {col.name} <span className="font-mono font-normal text-dim">{colTasks.length}</span>
                    </p>
                    {col.id && (
                      <button
                        type="button"
                        title="Delete column (tasks move to General)"
                        onClick={() => run(() => api(`/api/v1/categories/${col.id}`, "DELETE"))}
                        className="text-[11px] text-dim opacity-0 transition-opacity hover:text-danger group-hover/col:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {!showDone && (
                    <ColumnAdd
                      onAdd={(title) =>
                        run(() => api("/api/v1/tasks", "POST", { title, categoryId: col.id }))
                      }
                    />
                  )}
                  {colTasks.length === 0 ? (
                    <Empty label={showDone ? "Nothing here." : "All clear."} />
                  ) : (
                    <ul className="divide-y divide-line/50">
                      {colTasks.map((t) => (
                        <TaskRow key={t.id} task={t} today={today} columns={columns} onAction={run} />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
