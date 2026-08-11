import { gt, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { livePlayers } from "@/db/botOwnedTables";

/** Case-insensitive — bot's own note said usernames are matched as-given. */
export async function getLivePlayerByUsername(robloxUsername: string) {
  const rows = await db.select().from(livePlayers).where(ilike(livePlayers.robloxUsername, robloxUsername)).limit(1);
  return rows[0] ?? null;
}

/** "Online" = touched by the bot's poller in the last 90s, same convention used everywhere else. */
export async function listOnlinePlayers() {
  return db
    .select()
    .from(livePlayers)
    .where(gt(livePlayers.updatedAt, sql`now() - interval '90 seconds'`));
}
