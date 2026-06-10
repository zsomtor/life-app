"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskCategory } from "@/lib/repos/types";
import { api, broadcastRefresh, useApi } from "./useApi";
import { btnPrimaryCls, inputCls } from "./ui";

type Mode = "task" | "idea" | "shopping";

/**
 * Global quick-add: press `c` anywhere (or tap the + button) to capture a
 * task, an idea, or a shopping item without leaving the current view.
 */
export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("task");
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const categoriesApi = useApi<{ categories: TaskCategory[] }>("/api/v1/categories", 300_000);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setText("");
    setDue("");
    setError(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
      if (e.key === "c" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, mode]);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "task")
        await api("/api/v1/tasks", "POST", {
          title: text,
          dueDate: due || null,
          categoryId: categoryId || null,
        });
      else if (mode === "idea") await api("/api/v1/ideas", "POST", { content: text });
      else await api("/api/v1/shopping", "POST", { name: text });
      setText("");
      broadcastRefresh();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Quick add (c)"
        aria-label="Quick add"
        className="fixed right-4 bottom-4 z-40 grid size-12 place-items-center rounded-full border border-acc/40 bg-panel2 text-xl text-acc shadow-lg shadow-black/40 transition-transform hover:scale-105"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/60 p-4 pt-[18vh] backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="rise w-full max-w-lg rounded-2xl bg-panel p-3.5 shadow-2xl shadow-black/60">
            <div className="mb-2 flex items-center gap-1.5">
              {(["task", "idea", "shopping"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-2.5 py-1 text-[12.5px] font-medium capitalize transition-colors ${
                    mode === m ? "bg-panel2 text-ink" : "text-dim hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-dim">
                {savedFlash ? <span className="text-ok">saved ✓</span> : "Enter ↵ to save · Esc to close"}
              </span>
            </div>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={mode === "idea" ? 3 : 1}
              placeholder={
                mode === "task" ? "Task title…" : mode === "idea" ? "Brain dump…" : "Shopping item…"
              }
              className={`${inputCls} w-full resize-none text-[14px]`}
            />
            {mode === "task" && (
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  aria-label="Due date"
                  className={`${inputCls} font-mono text-[12px]`}
                />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  aria-label="Column"
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">General</option>
                  {(categoriesApi.data?.categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !text.trim()}
                  className={btnPrimaryCls}
                >
                  Add
                </button>
              </div>
            )}
            {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
