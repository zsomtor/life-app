import { env } from "../env";
import { createMemoryRepos } from "./memory";
import { createPostgresRepos } from "./postgres";
import type { Repos } from "./types";

declare global {
  var __lifeAppRepos: Repos | undefined;
}

/**
 * Storage driver selection. REPO_DRIVER=postgres|memory; defaults to
 * postgres when DATABASE_URL is set, memory otherwise (dev convenience).
 * PHASE 2: add a "file" driver (plain JSON in a workspace folder) for the
 * home-server setup — implement Repos in repos/file.ts and register it here.
 */
export function getRepos(): Repos {
  if (!globalThis.__lifeAppRepos) {
    const driver = env("REPO_DRIVER") ?? (env("DATABASE_URL") ? "postgres" : "memory");
    if (driver === "postgres") {
      globalThis.__lifeAppRepos = createPostgresRepos();
    } else {
      if (process.env.NODE_ENV !== "test") {
        console.warn(
          "[life-app] DATABASE_URL not set — using in-memory storage. Data will NOT persist."
        );
      }
      globalThis.__lifeAppRepos = createMemoryRepos();
    }
  }
  return globalThis.__lifeAppRepos;
}
