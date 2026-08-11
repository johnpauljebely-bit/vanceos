import { pgTable, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";

/**
 * Tables the bot creates and owns directly (not via this repo's Drizzle
 * migrations) — deliberately kept OUT of schema.ts / drizzle.config.ts's
 * tracked schema, so `drizzle-kit generate` never tries to "recreate" them
 * and fails on an already-exists error. This file exists purely so query
 * code here gets type safety; the actual DDL lifecycle belongs to the bot.
 *
 * live_players: per BOT_SIDE_INSTRUCTIONS.md #6/#7 — every online player,
 * independent of whether they hold a `callsigns` row yet, upserted every
 * ~30s by the bot's compliance-monitor poll loop. See COORDINATION.md for
 * the shape confirmation.
 */
export const livePlayers = pgTable("live_players", {
  robloxUsername: text("roblox_username").primaryKey(),
  robloxUserId: text("roblox_user_id"),
  team: text("team"),
  callsign: text("callsign"), // live in-game Callsign field, independent of any assigned callsigns row
  postal: text("postal"),
  locationX: doublePrecision("location_x"),
  locationZ: doublePrecision("location_z"),
  wantedStars: integer("wanted_stars"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
