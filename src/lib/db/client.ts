import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "../env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // Reuse the connection across hot reloads / lambda invocations.
  var __lifeAppDb: Db | undefined;
}

export function getDb(): Db {
  if (!globalThis.__lifeAppDb) {
    // `prepare: false` keeps this compatible with transaction-mode poolers
    // (Neon pooled connection strings, pgbouncer).
    const client = postgres(requireEnv("DATABASE_URL"), { prepare: false, max: 5 });
    globalThis.__lifeAppDb = drizzle(client, { schema });
  }
  return globalThis.__lifeAppDb;
}
