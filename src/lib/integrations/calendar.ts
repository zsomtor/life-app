import { addDays, dayRange, todayString } from "../time";
import type { CalendarEvent } from "./calendar-types";
import { getGoogleEvents, googleConfigured } from "./google-calendar";
import { getNotionEvents, notionConfigured } from "./notion-calendar";

export type CalendarResult = {
  events: CalendarEvent[];
  /** Sources that errored (the rest of the data is still usable). */
  errors: { source: string; message: string }[];
  configured: { google: boolean; notion: boolean };
};

function sortKey(e: CalendarEvent): string {
  // All-day events first within a day; then by start time.
  return e.allDay ? `${e.start}T00:00:00` : e.start;
}

export async function getMergedEvents(timeMin: Date, timeMax: Date): Promise<CalendarResult> {
  const [google, notion] = await Promise.allSettled([
    getGoogleEvents(timeMin, timeMax),
    getNotionEvents(timeMin, timeMax),
  ]);
  const errors: CalendarResult["errors"] = [];
  const events: CalendarEvent[] = [];
  if (google.status === "fulfilled") events.push(...google.value);
  else errors.push({ source: "google", message: String(google.reason?.message ?? google.reason) });
  if (notion.status === "fulfilled") events.push(...notion.value);
  else errors.push({ source: "notion", message: String(notion.reason?.message ?? notion.reason) });

  events.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  return {
    events,
    errors,
    configured: { google: googleConfigured(), notion: notionConfigured() },
  };
}

/** range: "today" | "week" (today + next 6 days). */
export async function getEventsForRange(range: "today" | "week"): Promise<CalendarResult> {
  const today = todayString();
  const { start } = dayRange(today);
  const { end } = dayRange(range === "today" ? today : addDays(today, 6));
  return getMergedEvents(start, end);
}
