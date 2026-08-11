import { config } from "dotenv";
import path from "node:path";

/**
 * Plain `dotenv/config` only loads a file literally named `.env` — this
 * project only has `.env.local` (Next.js's own convention, which Next
 * handles specially but the bare `dotenv` package does not). Using
 * `dotenv/config` here silently loaded nothing, so DATABASE_URL was unset
 * and standalone scripts (migrate/seed) fell back to local PGlite instead
 * of the real shared Postgres — confirmed as the cause of a real schema
 * drift between this project's scripts and the actual running app.
 */
config({ path: path.join(process.cwd(), ".env.local") });
