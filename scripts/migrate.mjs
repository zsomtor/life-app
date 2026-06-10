// Runs DB migrations before `next build` (see package.json "build").
// Skips silently when DATABASE_URL is absent so local/CI builds without a
// database keep working; on Vercel the env var is present and migrations
// apply automatically on every deploy (idempotent — drizzle-kit tracks
// applied migrations in the __drizzle_migrations table).
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[migrate] DATABASE_URL not set — skipping migrations.");
  process.exit(0);
}

console.log("[migrate] Applying database migrations…");
const result = spawnSync("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
