import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * DATABASE_URL unset -> embedded local PGlite (zero-install dev DB).
 * DATABASE_URL set   -> real Postgres via node-postgres.
 * Same schema/query code either way — pointing at the bot's future shared
 * Postgres instance is a config change, not a code change.
 */
function createDb() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url });
    return drizzleNodePg(pool, { schema });
  }
  const dataDir = process.env.PGLITE_DATA_DIR ?? "./.pglite";
  const client = new PGlite(dataDir);
  return drizzlePglite(client, { schema });
}

declare global {
  var __deltaCityCadDb: ReturnType<typeof createDb> | undefined;
}

// Reuse a single instance across Next.js dev-server hot reloads — a fresh
// PGlite client per reload would otherwise re-lock/reopen its data dir.
export const db = globalThis.__deltaCityCadDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalThis.__deltaCityCadDb = db;
}
