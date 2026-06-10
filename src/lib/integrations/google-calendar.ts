import { env } from "../env";
import type { CalendarEvent } from "./calendar-types";
import { googleAccessToken, googleConfigured } from "./google-auth";

/**
 * Google Calendar, read-only, via a stored OAuth refresh token.
 * Uses plain fetch against googleapis.com — no SDK needed.
 * GOOGLE_CALENDAR_IDS: comma-separated calendar ids (default: "primary").
 */

export { googleConfigured };

type GoogleEvent = {
  id: string;
  summary?: string;
  status?: string;
  htmlLink?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

export async function getGoogleEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
  if (!googleConfigured()) return [];
  const token = await googleAccessToken();
  const calendarIds = (env("GOOGLE_CALENDAR_IDS") ?? "primary").split(",").map((s) => s.trim());

  const results = await Promise.all(
    calendarIds.map(async (calId): Promise<CalendarEvent[]> => {
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`
      );
      url.searchParams.set("timeMin", timeMin.toISOString());
      url.searchParams.set("timeMax", timeMax.toISOString());
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      url.searchParams.set("maxResults", "100");
      const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Google events fetch failed (${calId}): ${res.status}`);
      const data = (await res.json()) as { items?: GoogleEvent[]; summary?: string };
      return (data.items ?? [])
        .filter((e) => e.status !== "cancelled")
        .map((e) => ({
          id: `google:${calId}:${e.id}`,
          title: e.summary ?? "(untitled)",
          start: e.start?.dateTime ?? e.start?.date ?? "",
          end: e.end?.dateTime ?? e.end?.date ?? null,
          allDay: Boolean(e.start?.date),
          source: "google" as const,
          calendar: data.summary ?? calId,
          url: e.htmlLink ?? null,
        }))
        .filter((e) => e.start);
    })
  );
  return results.flat();
}
