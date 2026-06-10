import { env } from "../env";
import type { CalendarEvent } from "./calendar-types";

/**
 * Team Notion calendar, read-only. Queries the calendar database and maps the
 * publish-date property to events. Property names are env-overridable since
 * they're workspace-specific (defaults match the BAZU "Calendar" database).
 */

const NOTION_VERSION = "2022-06-28";

export function notionConfigured(): boolean {
  return Boolean(env("NOTION_TOKEN") && env("NOTION_CALENDAR_DB_ID"));
}

const dateProp = () => env("NOTION_DATE_PROPERTY") ?? "❗️ Publish Date";
const titleProp = () => env("NOTION_TITLE_PROPERTY") ?? "Post";
const statusProp = () => env("NOTION_STATUS_PROPERTY") ?? "❗️ Status";
const excludedStatus = () => env("NOTION_EXCLUDED_STATUS") ?? "Shelved";

type NotionPage = {
  id: string;
  url: string;
  properties: Record<
    string,
    {
      type: string;
      title?: { plain_text: string }[];
      date?: { start: string; end: string | null } | null;
      status?: { name: string } | null;
      select?: { name: string } | null;
    }
  >;
};

export async function getNotionEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
  if (!notionConfigured()) return [];
  const dbId = env("NOTION_CALENDAR_DB_ID")!;
  const events: CalendarEvent[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env("NOTION_TOKEN")}`,
        "content-type": "application/json",
        "notion-version": NOTION_VERSION,
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: dateProp(), date: { on_or_after: timeMin.toISOString().slice(0, 10) } },
            { property: dateProp(), date: { on_or_before: timeMax.toISOString().slice(0, 10) } },
            { property: statusProp(), status: { does_not_equal: excludedStatus() } },
          ],
        },
        sorts: [{ property: dateProp(), direction: "ascending" }],
        page_size: 100,
        start_cursor: cursor,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Notion query failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    };

    for (const page of data.results) {
      const date = page.properties[dateProp()]?.date;
      if (!date?.start) continue;
      const title =
        page.properties[titleProp()]?.title?.map((t) => t.plain_text).join("") || "(untitled)";
      const status = page.properties[statusProp()]?.status?.name;
      events.push({
        id: `notion:${page.id}`,
        title,
        start: date.start,
        end: date.end,
        allDay: !date.start.includes("T"),
        source: "notion",
        calendar: status ? `Notion · ${status}` : "Notion",
        url: page.url,
      });
    }
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return events;
}
