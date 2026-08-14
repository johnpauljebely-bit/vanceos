import { db } from "@/db";
import { cadActivity } from "@/db/botOwnedTables";

/** Heartbeat write for the bot's "is this officer actually on the CAD dashboard" reminder poller. */
export async function recordCadActivity(discordId: string) {
  await db
    .insert(cadActivity)
    .values({ discordId, lastSeenAt: new Date() })
    .onConflictDoUpdate({ target: cadActivity.discordId, set: { lastSeenAt: new Date() } });
}
