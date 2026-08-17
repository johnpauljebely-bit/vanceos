import { eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { liveUnits } from "@/db/schema";
import type { UnitStatus } from "@/lib/unitStatus";

// Matches the unit-session cookie's own 12h maxAge — a row that hasn't
// been touched (duty toggle, status change, CAD mount) in that long is
// stale regardless of what its onDuty flag says. Belt-and-suspenders
// alongside explicitly flipping onDuty off on unit-switch/logout, since
// that only guards *future* switches, not rows already stuck stale.
const STALE_CUTOFF_MS = 12 * 60 * 60 * 1000;

export async function listLiveUnits() {
  const cutoff = new Date(Date.now() - STALE_CUTOFF_MS);
  return db.select().from(liveUnits).where(gt(liveUnits.updatedAt, cutoff));
}

export async function listLiveUnitsForUser(discordId: string) {
  return db.select().from(liveUnits).where(eq(liveUnits.discordId, discordId));
}

export async function setUnitDuty(input: {
  department: string;
  number: number;
  discordId: string;
  robloxUsername?: string;
  rank?: string;
  agency?: string;
  subdivision?: string;
  items?: string;
  onDuty: boolean;
  status?: UnitStatus;
}) {
  const callsignKey = `${input.department}-${input.number}`;
  await db
    .insert(liveUnits)
    .values({
      callsignKey,
      department: input.department,
      number: input.number,
      discordId: input.discordId,
      robloxUsername: input.robloxUsername,
      rank: input.rank,
      agency: input.agency,
      subdivision: input.subdivision,
      items: input.items,
      onDuty: input.onDuty,
      status: input.status ?? "available",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: liveUnits.callsignKey,
      set: {
        onDuty: input.onDuty,
        discordId: input.discordId,
        robloxUsername: input.robloxUsername,
        rank: input.rank,
        agency: input.agency,
        subdivision: input.subdivision,
        items: input.items,
        ...(input.status ? { status: input.status } : {}),
        updatedAt: new Date(),
      },
    });
}

export async function setUnitStatus(callsignKey: string, status: UnitStatus) {
  await db.update(liveUnits).set({ status, updatedAt: new Date() }).where(eq(liveUnits.callsignKey, callsignKey));
}

/**
 * Flip a specific callsign offline without touching its other columns —
 * used when a player switches to a different unit or logs out, so the
 * callsign they just left doesn't stay a permanent "ghost" in Active Units
 * (setUnitDuty only ever upserts the *new* callsign, never the old one).
 */
export async function setUnitOffDutyByCallsign(callsignKey: string) {
  await db.update(liveUnits).set({ onDuty: false, updatedAt: new Date() }).where(eq(liveUnits.callsignKey, callsignKey));
}

export async function getLiveUnit(callsignKey: string) {
  const rows = await db.select().from(liveUnits).where(eq(liveUnits.callsignKey, callsignKey)).limit(1);
  return rows[0] ?? null;
}
