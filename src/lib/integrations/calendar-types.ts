export type CalendarEvent = {
  id: string;
  title: string;
  /** ISO datetime, or YYYY-MM-DD for all-day events. */
  start: string;
  end: string | null;
  allDay: boolean;
  source: "google" | "notion";
  /** Calendar name (Google) or label like platform/status (Notion). */
  calendar: string | null;
  url: string | null;
};
