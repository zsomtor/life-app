"use client";

import { useState } from "react";
import { Card } from "./ui";
import { TodayHero } from "./TodayHero";
import { TasksCard } from "./TasksCard";
import { TeamTasksCard } from "./TeamTasksCard";
import { IdeasCard } from "./IdeasCard";
import { ShoppingList } from "./ShoppingList";
import { WeekView } from "./WeekView";
import { QuickAdd } from "./QuickAdd";

export function Dashboard({ today, sharePath }: { today: string; sharePath: string | null }) {
  const [copied, setCopied] = useState(false);

  const copyShare = async () => {
    if (!sharePath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <main className="mx-auto max-w-6xl px-3 pt-4 pb-20 sm:px-5">
      <header className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[13px] tracking-widest text-acc">LIFE://</p>
        <nav className="flex items-center gap-3 text-[12px] text-dim">
          <span className="hidden sm:inline">
            press <kbd className="rounded border border-line bg-panel2 px-1 font-mono">c</kbd> to capture
          </span>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="transition-colors hover:text-ink"
          >
            log out
          </button>
        </nav>
      </header>

      <div className="space-y-4">
        <TodayHero today={today} />
        <WeekView today={today} />
        <div className="grid gap-4 md:grid-cols-2">
          <TasksCard today={today} />
          <TeamTasksCard today={today} />
          <Card
            title="Shopping"
            action={
              sharePath ? (
                <button
                  type="button"
                  onClick={copyShare}
                  className="text-[12px] text-dim transition-colors hover:text-acc"
                  title="Copy the share link for the shopping list"
                >
                  {copied ? "link copied ✓" : "copy share link"}
                </button>
              ) : (
                <span className="text-[11px] text-dim" title="Set SHOPPING_SHARE_TOKEN to enable sharing">
                  no share token
                </span>
              )
            }
          >
            <ShoppingList apiBase="/api/v1/shopping" />
          </Card>
          <IdeasCard />
        </div>
      </div>

      <QuickAdd />
    </main>
  );
}
