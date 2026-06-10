<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Life dashboard

API-first personal dashboard. Key layout:
- `src/lib/repos/` — storage interface; drivers: postgres (Drizzle/Neon), memory (dev/tests). Phase 2: file driver.
- `src/lib/services/` — business logic (tasks, shopping, ideas, briefing); always testable against the memory repo.
- `src/lib/integrations/` — BAZU team-tasks REST client, Google Calendar, Notion calendar, Resend mailer, Phase-2 stats stubs.
- `src/app/api/v1/*` — REST API (cookie session or Bearer DASHBOARD_API_TOKEN).
- `src/app/api/[transport]/route.ts` — MCP server at /api/mcp (mcp-handler, streamable HTTP, 12 tools).
- `src/app/api/share/shopping/*` + `src/app/shopping/[shareToken]` — public share surface; expose nothing beyond shopping.
- Tests: `npm run test:run` (vitest, services x memory repo). Migrations: `npm run db:generate` / `db:migrate`.

Rules of the house: every new feature lands as service + REST endpoint + (if useful to the copilot) MCP tool, then UI. Secrets stay server-side. Free tiers only — flag anything that would cost money before building it.
