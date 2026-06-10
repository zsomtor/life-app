"use client";

import { useState } from "react";
import type { Idea } from "@/lib/repos/types";
import { api, broadcastRefresh, useApi } from "./useApi";
import { Card, CountBadge, Empty, ErrorNote, IconButton, Loading, inputCls } from "./ui";

export function IdeasCard() {
  const [view, setView] = useState<"inbox" | "archived">("inbox");
  const { data, error, loading } = useApi<{ ideas: Idea[] }>(`/api/v1/ideas?status=${view}`, 60_000);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
      broadcastRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const capture = () =>
    run(async () => {
      if (!content.trim() || busy) return;
      setBusy(true);
      try {
        await api("/api/v1/ideas", "POST", { content });
        setContent("");
      } finally {
        setBusy(false);
      }
    });

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const ideas = data?.ideas ?? [];

  return (
    <Card
      title="Idea inbox"
      badge={view === "inbox" && data ? <CountBadge n={ideas.length} tone="warn" /> : undefined}
      action={
        <div className="flex items-center gap-2">
          {view === "inbox" && ideas.length > 0 && (
            <button
              type="button"
              onClick={() => copy(ideas.map((i) => `- ${i.content}`).join("\n"), "all")}
              className="text-[12px] text-dim transition-colors hover:text-acc"
            >
              {copied === "all" ? "copied ✓" : "copy all"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setView((v) => (v === "inbox" ? "archived" : "inbox"))}
            className="text-[12px] text-dim transition-colors hover:text-ink"
          >
            {view === "inbox" ? "archive ↩" : "inbox ↩"}
          </button>
        </div>
      }
    >
      {view === "inbox" && (
        <form
          className="mb-2"
          onSubmit={(e) => {
            e.preventDefault();
            capture();
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                capture();
              }
            }}
            placeholder="Dump an idea… (Enter to save, Shift+Enter for newline)"
            rows={2}
            className={`${inputCls} w-full resize-none`}
          />
        </form>
      )}
      {actionError && <ErrorNote message={actionError} />}
      {loading && !data ? (
        <Loading />
      ) : error && !data ? (
        <ErrorNote message={error} />
      ) : ideas.length === 0 ? (
        <Empty label={view === "inbox" ? "Inbox zero. Beautiful." : "Nothing archived."} />
      ) : (
        <ul className="max-h-72 divide-y divide-line/60 overflow-y-auto pr-1">
          {ideas.map((i) => (
            <li key={i.id} className="group flex items-start gap-2 py-1.5">
              <p className="min-w-0 flex-1 text-[13px] whitespace-pre-wrap select-text">{i.content}</p>
              <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <IconButton label="Copy" tone="acc" onClick={() => copy(i.content, i.id)}>
                  {copied === i.id ? "✓" : "⧉"}
                </IconButton>
                {view === "inbox" ? (
                  <>
                    <IconButton
                      label="Convert to task"
                      tone="ok"
                      onClick={() => run(() => api(`/api/v1/ideas/${i.id}`, "PATCH", { action: "convert_task" }))}
                    >
                      →task
                    </IconButton>
                    <IconButton
                      label="Convert to shopping item"
                      tone="ok"
                      onClick={() =>
                        run(() => api(`/api/v1/ideas/${i.id}`, "PATCH", { action: "convert_shopping" }))
                      }
                    >
                      →shop
                    </IconButton>
                    <IconButton
                      label="Archive"
                      onClick={() => run(() => api(`/api/v1/ideas/${i.id}`, "PATCH", { action: "archive" }))}
                    >
                      ▣
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    label="Restore to inbox"
                    onClick={() => run(() => api(`/api/v1/ideas/${i.id}`, "PATCH", { action: "restore" }))}
                  >
                    ↩
                  </IconButton>
                )}
                <IconButton label="Delete" tone="danger" onClick={() => run(() => api(`/api/v1/ideas/${i.id}`, "DELETE"))}>
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
