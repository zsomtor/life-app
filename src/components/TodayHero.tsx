"use client";

import type { TodayBriefing } from "@/lib/services/briefing";
import { api, broadcastRefresh, useApi } from "./useApi";
import { CheckCircle, Empty, ErrorNote, Loading } from "./ui";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function TodayHero({ today }: { today: string }) {
  const { data, error, loading } = useApi<TodayBriefing>("/api/v1/briefing/today", 60_000);

  const complete = async (id: string) => {
    try {
      await api(`/api/v1/tasks/${id}`, "PATCH", { done: true });
      broadcastRefresh();
    } catch {
      /* surfaced by the board on next refresh */
    }
  };

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const focus = data ? [...data.personalTasks.overdue, ...data.personalTasks.dueToday] : [];
  const teamToday = data
    ? [...data.teamTasks.overdue, ...data.teamTasks.dueToday].filter(
        (t) => t.assigned_to === "Zsomtor" || t.co_assignees?.includes("Zsomtor")
      )
    : [];

  return (
    <section className="rise rounded-2xl bg-panel px-4 py-4 sm:px-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">{dateLabel}</h1>
        {data && (
          <div className="flex items-center gap-4 text-[12.5px] text-dim">
            <span>
              <span className="font-mono text-mut">{data.personalTasks.openCount}</span> open
            </span>
            <span>
              <span className="font-mono text-mut">{data.calendar.length}</span> events
            </span>
            <span className={data.ideaInboxCount > 0 ? "text-warn" : ""}>
              <span className="font-mono">{data.ideaInboxCount}</span> in inbox
            </span>
          </div>
        )}
      </div>

      {loading && !data ? (
        <Loading label="Assembling your day…" />
      ) : error && !data ? (
        <ErrorNote message={error} />
      ) : data ? (
        <div className="grid gap-5 md:grid-cols-2">
          {/* Schedule */}
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-dim uppercase">
              Schedule
            </p>
            {data.calendar.length === 0 ? (
              <Empty label="No events today." />
            ) : (
              <ul className="space-y-1.5">
                {data.calendar.map((e) => (
                  <li key={e.id} className="flex items-center gap-2.5 text-[13.5px]">
                    <span className="w-11 shrink-0 text-right font-mono text-[11.5px] text-mut">
                      {e.allDay ? "—" : fmtTime(e.start)}
                    </span>
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        e.source === "google" ? "bg-acc" : "bg-warn"
                      }`}
                      title={e.source}
                    />
                    <span className="min-w-0 flex-1 truncate">{e.title}</span>
                    {e.calendar && (
                      <span className="hidden truncate text-[11px] text-dim sm:inline">{e.calendar}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Focus */}
          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-dim uppercase">
              Due today
            </p>
            {focus.length === 0 && teamToday.length === 0 ? (
              <Empty label="Nothing due. Pick something meaningful." />
            ) : (
              <ul className="space-y-1.5">
                {focus.map((t) => (
                  <li key={t.id} className="flex items-center gap-2.5 text-[13.5px]">
                    <CheckCircle checked={false} label={`complete ${t.title}`} onChange={() => complete(t.id)} />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    {t.dueDate && t.dueDate < today && (
                      <span className="font-mono text-[11px] text-danger">{t.dueDate.slice(5)}</span>
                    )}
                  </li>
                ))}
                {teamToday.map((t) => (
                  <li key={t.id} className="flex items-center gap-2.5 text-[13.5px] text-mut">
                    <span className="grid size-[20px] shrink-0 place-items-center text-[10px] text-acc">⇡</span>
                    <span className="min-w-0 flex-1 truncate" title="Team task">
                      {t.title}
                    </span>
                    {t.due_date && t.due_date < today && (
                      <span className="font-mono text-[11px] text-danger">{t.due_date.slice(5)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {data && data.errors.length > 0 && (
        <p
          className="mt-3 text-[11.5px] text-dim"
          title={data.errors.map((e) => `${e.source}: ${e.message}`).join("\n")}
        >
          ⚠ {data.errors.map((e) => e.source).join(", ")} unavailable — showing the rest.
        </p>
      )}
    </section>
  );
}
