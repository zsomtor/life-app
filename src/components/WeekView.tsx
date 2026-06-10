"use client";

import type { CalendarEvent } from "@/lib/integrations/calendar-types";
import { useApi } from "./useApi";
import { Card, Empty, ErrorNote, Loading } from "./ui";

type CalendarPayload = {
  events: CalendarEvent[];
  errors: { source: string; message: string }[];
  configured: { google: boolean; notion: boolean };
};

function dayKey(e: CalendarEvent): string {
  // All-day events carry YYYY-MM-DD; timed events get bucketed by local date.
  return e.allDay ? e.start.slice(0, 10) : new Date(e.start).toLocaleDateString("en-CA");
}

export function WeekView({ today }: { today: string }) {
  const { data, error, loading } = useApi<CalendarPayload>("/api/v1/calendar?range=week", 300_000);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-CA");
  });

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of data?.events ?? []) {
    const k = dayKey(e);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }

  const notConfigured = data && !data.configured.google && !data.configured.notion;

  return (
    <Card title="Week">
      {loading && !data ? (
        <Loading />
      ) : error && !data ? (
        <ErrorNote message={error} />
      ) : notConfigured ? (
        <Empty label="Connect Google and/or Notion calendars in env to see your week." />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day) => {
            const events = byDay.get(day) ?? [];
            const label = new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
            });
            return (
              <div
                key={day}
                className={`min-h-20 rounded-xl p-2 ${
                  day === today ? "bg-acc/10 ring-1 ring-acc/40" : "bg-panel2/50"
                }`}
              >
                <p className={`mb-1 text-[11px] font-semibold ${day === today ? "text-acc" : "text-dim"}`}>
                  {label}
                </p>
                <ul className="space-y-0.5">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-1 truncate text-[11.5px] leading-4"
                      title={`${e.title}${e.calendar ? ` · ${e.calendar}` : ""}`}
                    >
                      <span
                        className={`size-1 shrink-0 rounded-full ${e.source === "google" ? "bg-acc" : "bg-warn"}`}
                      />
                      <span className="truncate">{e.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      {data && data.errors.length > 0 && (
        <p className="mt-2 text-[11.5px] text-dim">
          ⚠ {data.errors.map((e) => e.source).join(", ")} unavailable.
        </p>
      )}
    </Card>
  );
}
