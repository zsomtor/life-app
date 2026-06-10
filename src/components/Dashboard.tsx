"use client";

import { useState } from "react";
import { Card } from "./ui";
import { TodayHero } from "./TodayHero";
import { TasksBoard } from "./TasksBoard";
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
    <main className="mx-auto max-w-7xl px-3 pt-5 pb-20 sm:px-6">
      <header className="mb-5 flex items-center justify-between px-1">
        <p className="text-[17px] font-semibold tracking-tight">Life</p>
        <nav className="flex items-center gap-4 text-[12.5px] text-dim">
          <span className="hidden sm:inline">
            press <kbd className="rounded-md bg-panel2 px-1.5 py-0.5 font-mono text-[11px]">c</kbd> to
            capture
          </span>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="transition-colors hover:text-ink"
          >
            Log out
          </button>
        </nav>
      </header>

      <div className="space-y-3">
        <TodayHero today={today} />
        <WeekView today={today} />
        <TasksBoard today={today} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TeamTasksCard today={today} />
          <Card
            title="Shopping"
            action={
              sharePath ? (
                <button
                  type="button"
                  onClick={copyShare}
                  className="text-[12.5px] text-dim transition-colors hover:text-acc"
                  title="Copy the share link for the shopping list"
                >
                  {copied ? "Link copied ✓" : "Copy share link"}
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
