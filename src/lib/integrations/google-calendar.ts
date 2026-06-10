import { env } from "../env";
import type { CalendarEvent } from "./calendar-types";

/**
 * Google Calendar, read-only, via a stored OAuth refresh token.
 * Uses plain fetch against googleapis.com — no SDK needed.
 * GOOGLE_CALENDAR_IDS: comma-separated calendar ids (default: "primary").
 */

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export function googleConfigured(): boolean {
  return Boolean(
    env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET") && env("GOOGLE_REFRESH_TOKEN")
  );
}

async function accessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID")!,
      client_secret: env("GOOGLE_CLIENT_SECRET")!,
      refresh_token: env("GOOGLE_REFRESH_TOKEN")!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

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
  const token = await accessToken();
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
