# Life — personal life dashboard

A dark, data-dense command center for running the day: personal to-dos, the
BAZU team task list, merged Google + Notion calendars, a quick-capture idea
inbox, and a shopping list shareable by link.

**Architecture principle: the backend is API-first.** Every feature is a
token-authenticated REST API; the web UI is just one client. A bundled MCP
server (`/api/mcp`) exposes the same operations so a Claude copilot operates
on identical live data.

## Stack

- Next.js (App Router) + TypeScript + Tailwind, deployable on Vercel Hobby
- Postgres (Neon free tier) via Drizzle; storage behind a swappable repository
  layer (`src/lib/repos/`) — `postgres` in prod, `memory` for zero-config dev,
  and a `file` driver is the marked Phase-2 extension point for a home server
- Single-password login (signed session cookie), no user management
- PWA-installable (manifest + icons), responsive

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in at least AUTH_SECRET + DASHBOARD_PASSWORD
npm run dev                  # http://localhost:3000
```

Without `DATABASE_URL` the app runs on an in-memory store (data resets on
restart) — handy for trying it out. Tests: `npm run test:run`.

## Database (Neon, free)

1. Create a project at neon.tech, copy the **pooled** connection string.
2. Set `DATABASE_URL` in `.env.local` (and later in Vercel).
3. Migrations apply automatically as part of `npm run build` whenever
   `DATABASE_URL` is set (see `scripts/migrate.mjs`); to run them manually:
   `npm run db:migrate` (migrations live in `drizzle/`).

## Deploy to Vercel

1. Push this repo to GitHub, import it in Vercel (Hobby plan is fine).
2. Add the env vars from `.env.example` (Project → Settings → Environment
   Variables). Minimum: `DATABASE_URL`, `AUTH_SECRET`, `DASHBOARD_PASSWORD`,
   `DASHBOARD_API_TOKEN`, `SHOPPING_SHARE_TOKEN`.
3. Deploy — migrations run automatically during the build when
   `DATABASE_URL` is present.
4.  `vercel.json` registers the optional daily-briefing cron
   (05:00 UTC = 07:00 Budapest in summer); it no-ops until you enable the
   mailer flags.

## The API

All under `/api/v1/*`. Auth: session cookie (browser) **or**
`Authorization: Bearer $DASHBOARD_API_TOKEN` **or** `?token=`.

| Endpoint | Methods | Notes |
| --- | --- | --- |
| `/api/v1/tasks` | GET, POST | `?done=true\|false`, `?dueOnOrBefore=YYYY-MM-DD` |
| `/api/v1/tasks/:id` | PATCH, DELETE | `{title?, notes?, dueDate?, done?}` |
| `/api/v1/tasks/:id/promote` | POST | push to team list `{assigned_to?, due_date?, priority?}` |
| `/api/v1/team-tasks` | GET, POST | proxied to the BAZU REST API, server-side |
| `/api/v1/team-tasks/:id/complete` | POST | tries `POST :id/complete`, falls back to `PATCH :id {status:"done"}` |
| `/api/v1/shopping` | GET, POST | `{name, quantity?}` |
| `/api/v1/shopping/:id` | PATCH, DELETE | `{checked?, name?, quantity?}` |
| `/api/v1/ideas` | GET, POST | `?status=inbox\|archived\|converted_task\|converted_shopping` |
| `/api/v1/ideas/:id` | PATCH, DELETE | `{action: archive\|restore\|convert_task\|convert_shopping}` |
| `/api/v1/calendar` | GET | `?range=today\|week`, merged Google+Notion |
| `/api/v1/briefing/today` | GET | the one-call daily aggregate |
| `/api/v1/stats` | GET | PHASE 2 placeholders (newsletter / YouTube) |
| `/api/cron/briefing` | GET | cron target; needs `CRON_SECRET` or API token |

Public share (no login, token-scoped to shopping only):
`GET/POST /api/share/shopping/<token>`, `PATCH/DELETE /api/share/shopping/<token>/<id>`.

## Shopping share link

Send your girlfriend `https://<your-app>/shopping/<SHOPPING_SHARE_TOKEN>` —
one link, lands directly on the live list, read/write, nothing else reachable.
The dashboard's Shopping card has a "copy share link" button. **Rotate** by
changing `SHOPPING_SHARE_TOKEN` in Vercel env (old link dies instantly).

## Claude as a second client (MCP)

The MCP server runs inside the app at `/api/mcp` (streamable HTTP). Tools:
`get_tasks`, `add_task`, `complete_task`, `get_team_tasks`, `add_team_task`,
`complete_team_task`, `get_shopping`, `add_shopping_item`,
`check_shopping_item`, `add_idea`, `list_ideas`, `get_today_briefing`.

**claude.ai / Claude apps (custom connector):** Settings → Connectors → Add
custom connector, URL:

```
https://<your-app>.vercel.app/api/mcp?token=<DASHBOARD_API_TOKEN>
```

(The token rides in the URL because connectors can't set headers. Treat the
URL as a secret.)

**Claude Code:**

```bash
claude mcp add --transport http life https://<your-app>.vercel.app/api/mcp \
  --header "Authorization: Bearer <DASHBOARD_API_TOKEN>"
```

Then: "what's on today?" → `get_today_briefing`; "add milk to the shopping
list" → `add_shopping_item`. Same data the web UI shows, live.

## Google Calendar setup (read-only, click-by-click)

1. console.cloud.google.com → create project (e.g. `life-dashboard`).
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **OAuth consent screen**: External, fill app name + your email; add
   yourself under **Test users**. Scope to add:
   `https://www.googleapis.com/auth/calendar.readonly`.
   Note: while the consent screen is in *Testing* mode Google expires refresh
   tokens after 7 days — click **Publish app** (it can stay unverified for
   your own use) to get long-lived refresh tokens.
4. **Credentials → Create credentials → OAuth client ID → Web application**,
   add redirect URI `https://developers.google.com/oauthplayground`.
   Copy client id/secret → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. Get a refresh token via the OAuth Playground:
   developers.google.com/oauthplayground → ⚙ → check **Use your own OAuth
   credentials**, paste id+secret → in Step 1 enter the scope above →
   Authorize → Step 2 **Exchange authorization code for tokens** → copy the
   **refresh token** → `GOOGLE_REFRESH_TOKEN`.
6. `GOOGLE_CALENDAR_IDS=primary` (or add more ids from Google Calendar →
   calendar Settings → Integrate calendar, comma-separated).

## Notion setup

1. notion.so/my-integrations → New integration (internal), copy the secret →
   `NOTION_TOKEN`.
2. In Notion, open the BAZU **Calendar** database → ⋯ → Connections → add
   your integration.
3. `NOTION_CALENDAR_DB_ID=14e25b39b6ca805c909df23173a8ee86` (pre-filled in
   `.env.example`). Events come from `❗️ Publish Date`; Shelved items are
   excluded. Property names are overridable via env if you rename them.

## Team task manager (BAZU)

`TEAM_TASKS_API_URL=https://bazu-task-manager.vercel.app/api/tasks` — GET
lists open tasks, POST creates (`title`, `description?`, `assigned_to`
(Zsomtor|Kazu|Bálint|Tamás), `due_date`, `priority`). Completing tries
`POST /api/tasks/:id/complete` then falls back to `PATCH /api/tasks/:id`
with `{status:"done"}` — **verify once after deploy** and, if the server uses
a different route, adjust `completeTeamTask()` in
`src/lib/integrations/team-tasks.ts`. If the API needs `assigned_phone`,
set `TEAM_PHONE_MAP` (kept out of the repo on purpose).

## Daily briefing

- **Primary path:** your Claude copilot calls `get_today_briefing` (MCP) or
  `GET /api/v1/briefing/today` and writes the analysis itself.
- **Fallback sender:** flip `BRIEFING_EMAIL_ENABLED=true` and set
  `MAILER_RESEND_API_KEY` (resend.com, free tier) + `BRIEFING_TO_EMAIL`; the
  Vercel cron then emails a plain data digest daily. The composer is a single
  swappable function (`composeBriefing` in `src/lib/integrations/mailer.ts`)
  so an LLM-written summary can replace it without touching the cron.
- Schedule: edit `vercel.json` (`0 5 * * *` UTC). On a home server, any cron
  hitting `/api/cron/briefing` with `Authorization: Bearer $DASHBOARD_API_TOKEN`
  does the same job.

## What's stubbed for Phase 2

- **Newsletter subscriber count** (MailerLite) — implemented but feature-
  flagged off; flip `STATS_NEWSLETTER_ENABLED=true` + `MAILERLITE_API_KEY`.
- **YouTube monthly long-form views** — scaffolded only
  (`src/lib/integrations/phase2-stats.ts` documents the Analytics API +
  duration-filter approach and the OAuth needed); behind `STATS_YOUTUBE_ENABLED`.
- **Dashboard stats card** — `/api/v1/stats` already returns the shape; a card
  just needs to render it.
- **File-based storage driver** for the home server — extension point marked
  in `src/lib/repos/index.ts`.

Everything in v1 runs on free tiers: Vercel Hobby, Neon free, Google Calendar
API, Notion API, Resend free (optional).
