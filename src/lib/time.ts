import { APP_TIMEZONE } from "./env";

/** "YYYY-MM-DD" for a date as seen in the app timezone. */
export function localDateString(d: Date = new Date(), tz = APP_TIMEZONE()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** UTC offset of `tz` at instant `d`, in minutes (e.g. Budapest summer = 120). */
function tzOffsetMinutes(d: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(d).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - d.getTime()) / 60000;
}

/** Start/end instants of a local calendar day ("YYYY-MM-DD") in the app timezone. */
export function dayRange(dateStr: string, tz = APP_TIMEZONE()): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  // First guess: midnight UTC, then correct by the zone offset at that instant.
  let start = new Date(Date.UTC(y, m - 1, d));
  start = new Date(start.getTime() - tzOffsetMinutes(start, tz) * 60000);
  // Re-correct once in case the offset changed across the guess (DST edge).
  start = new Date(Date.UTC(y, m - 1, d) - tzOffsetMinutes(start, tz) * 60000);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return { start, end };
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function todayString(): string {
  return localDateString();
}
