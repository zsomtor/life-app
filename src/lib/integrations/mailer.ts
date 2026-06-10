import { env, flag } from "../env";
import type { TodayBriefing } from "../services/briefing";

/**
 * Optional daily briefing email — a reliable fallback sender behind a feature
 * flag. The *primary* briefing author is the Claude copilot via MCP
 * (get_today_briefing); this path just guarantees an email lands even if no
 * copilot runs that morning.
 *
 * Enable with BRIEFING_EMAIL_ENABLED=true + MAILER_RESEND_API_KEY (Resend free
 * tier) + BRIEFING_TO_EMAIL [+ MAILER_FROM_EMAIL].
 *
 * The summary step is intentionally swappable: renderBriefingHtml is a plain
 * data renderer. To plug in an LLM (or any other writer), replace the
 * `composeBriefing` implementation — nothing else changes.
 */

export function briefingEmailEnabled(): boolean {
  return flag("BRIEFING_EMAIL_ENABLED") && Boolean(env("MAILER_RESEND_API_KEY")) && Boolean(env("BRIEFING_TO_EMAIL"));
}

export type ComposedBriefing = { subject: string; html: string };

/** Swap point for smarter analysis (LLM summary, conflict detection, etc.). */
export async function composeBriefing(b: TodayBriefing): Promise<ComposedBriefing> {
  return { subject: `Daily briefing — ${b.date}`, html: renderBriefingHtml(b) };
}

export function renderBriefingHtml(b: TodayBriefing): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const taskLi = (t: { title: string; dueDate?: string | null; due_date?: string | null }) =>
    `<li>${esc(t.title)}${t.dueDate || t.due_date ? ` <small>(${t.dueDate ?? t.due_date})</small>` : ""}</li>`;
  const eventLi = (e: { title: string; start: string; allDay: boolean }) =>
    `<li>${e.allDay ? "all-day" : esc(e.start.slice(11, 16))} — ${esc(e.title)}</li>`;
  const section = (title: string, inner: string) =>
    `<h3 style="margin:16px 0 4px">${title}</h3>${inner || "<p>—</p>"}`;

  return `<div style="font-family:sans-serif;max-width:560px">
<h2>Today — ${b.date}</h2>
${section("Overdue", b.personalTasks.overdue.length ? `<ul>${b.personalTasks.overdue.map(taskLi).join("")}</ul>` : "")}
${section("Due today", b.personalTasks.dueToday.length ? `<ul>${b.personalTasks.dueToday.map(taskLi).join("")}</ul>` : "")}
${section("Team (due/overdue)", [...b.teamTasks.overdue, ...b.teamTasks.dueToday].length ? `<ul>${[...b.teamTasks.overdue, ...b.teamTasks.dueToday].map(taskLi).join("")}</ul>` : "")}
${section("Calendar", b.calendar.length ? `<ul>${b.calendar.map(eventLi).join("")}</ul>` : "")}
<p>${b.ideaInboxCount} idea(s) waiting in the inbox.</p>
${b.errors.length ? `<p style="color:#b45309">⚠ Sources unavailable: ${b.errors.map((e) => esc(e.source)).join(", ")}</p>` : ""}
</div>`;
}

export async function sendBriefingEmail(composed: ComposedBriefing): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env("MAILER_RESEND_API_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env("MAILER_FROM_EMAIL") ?? "Life Dashboard <onboarding@resend.dev>",
      to: [env("BRIEFING_TO_EMAIL")],
      subject: composed.subject,
      html: composed.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend send failed: ${res.status} ${text.slice(0, 300)}`);
  }
}
