import { APP_TIMEZONE } from "../env";
import { todayString } from "../time";
import { getRepos } from "../repos";
import type { Repos } from "../repos/types";
import { getEventsForRange } from "../integrations/calendar";
import { getTeamTasks, teamTasksConfigured } from "../integrations/team-tasks";
import { todayTasks } from "./tasks";

/**
 * The single aggregate behind `get_today_briefing` (MCP) and
 * GET /api/v1/briefing/today. Everything a daily briefing needs in one call.
 * Sections degrade independently: a failing integration lands in `errors`
 * instead of failing the whole payload.
 */
export async function getTodayBriefing(repos: Repos = getRepos()) {
  const date = todayString();
  const errors: { source: string; message: string }[] = [];

  const [personal, team, calendar, inbox] = await Promise.allSettled([
    todayTasks(date, repos),
    teamTasksConfigured() ? getTeamTasks() : Promise.resolve([]),
    getEventsForRange("today"),
    repos.ideas.countInbox(),
  ]);

  if (personal.status === "rejected")
    errors.push({ source: "personal_tasks", message: String(personal.reason) });
  if (team.status === "rejected")
    errors.push({ source: "team_tasks", message: String(team.reason) });
  if (calendar.status === "rejected")
    errors.push({ source: "calendar", message: String(calendar.reason) });
  else errors.push(...calendar.value.errors);
  if (inbox.status === "rejected")
    errors.push({ source: "idea_inbox", message: String(inbox.reason) });

  const teamTasks = team.status === "fulfilled" ? team.value : [];
  const openTeam = teamTasks.filter((t) => t.status === "open");

  return {
    date,
    timezone: APP_TIMEZONE(),
    generatedAt: new Date().toISOString(),
    personalTasks:
      personal.status === "fulfilled"
        ? personal.value
        : { dueToday: [], overdue: [], openCount: 0 },
    teamTasks: {
      configured: teamTasksConfigured(),
      dueToday: openTeam.filter((t) => t.due_date === date),
      overdue: openTeam.filter((t) => t.due_date !== null && t.due_date! < date),
      all: openTeam,
    },
    calendar: calendar.status === "fulfilled" ? calendar.value.events : [],
    ideaInboxCount: inbox.status === "fulfilled" ? inbox.value : 0,
    errors,
  };
}

export type TodayBriefing = Awaited<ReturnType<typeof getTodayBriefing>>;
