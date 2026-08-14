import { eq } from "drizzle-orm";
import { db } from "@/db";
import { links, liveUnits } from "@/db/schema";
import { livePlayers } from "@/db/botOwnedTables";
import { pctToWorld } from "@/lib/mapTransform";
import { postalToCoords } from "@/lib/postalCoords";
import { assignUnitToCall } from "@/db/queries/calls";
import { setUnitStatus } from "@/db/queries/liveUnits";

export interface DispatchedUnit {
  callsignKey: string;
  department: string;
  number: number;
  postal: string | null;
  distanceKnown: boolean;
}

/**
 * Ranks available, on-duty units by real distance to a target postal, using
 * each unit's live `location_x`/`location_z` where resolvable. Units whose
 * live position can't be resolved (not currently online, or unlinked) are
 * still eligible — ranked after known-distance units — so a request never
 * comes up short just because position data is incomplete.
 *
 * `preferredDepartment` is optional: when given (an officer requesting
 * backup), same-department candidates rank first, then any other LEO
 * department. Omitted (e.g. a civilian 911/311 call with no requesting
 * officer to prefer around), ranking is pure distance across all
 * departments. `excludeDiscordId` is similarly optional.
 */
export async function findNearestAvailableUnits(input: {
  excludeDiscordId?: string;
  preferredDepartment?: string;
  count: number;
  targetPostal: string;
}): Promise<DispatchedUnit[]> {
  const targetPct = postalToCoords(input.targetPostal);
  const targetWorld = targetPct ? pctToWorld(targetPct[0], targetPct[1]) : null;

  const [allLinks, allLivePlayers, allUnits] = await Promise.all([
    db.select().from(links),
    db.select().from(livePlayers),
    db.select().from(liveUnits),
  ]);

  const robloxByDiscordId = new Map(allLinks.map((l) => [l.discordId, l.robloxUsername]));
  const playerByUsername = new Map(allLivePlayers.map((p) => [p.robloxUsername.toLowerCase(), p]));

  const candidates = allUnits.filter(
    (u) => u.onDuty && u.status === "available" && u.discordId && u.discordId !== input.excludeDiscordId,
  );

  const withDistance = candidates.map((u) => {
    const robloxUsername = u.discordId ? robloxByDiscordId.get(u.discordId) : undefined;
    const live = robloxUsername ? playerByUsername.get(robloxUsername.toLowerCase()) : undefined;
    let distance: number | null = null;
    if (live && targetWorld && live.locationX !== null && live.locationZ !== null) {
      const dx = live.locationX - targetWorld[0];
      const dz = live.locationZ - targetWorld[1];
      distance = Math.sqrt(dx * dx + dz * dz);
    }
    const samedept = input.preferredDepartment ? u.department === input.preferredDepartment : false;
    return { unit: u, distance, samedept };
  });

  // Same department (if requested), closest first; then everyone else,
  // closest first; unknown-distance candidates sort after known ones.
  withDistance.sort((a, b) => {
    if (a.samedept !== b.samedept) return a.samedept ? -1 : 1;
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return withDistance.slice(0, input.count).map(({ unit, distance }) => ({
    callsignKey: unit.callsignKey,
    department: unit.department,
    number: unit.number,
    postal: unit.postal,
    distanceKnown: distance !== null,
  }));
}

/**
 * How many units a civilian call auto-dispatches, per the user's rules:
 * a 311/civil report shouldn't pull everyone in, a real 911 call gets a
 * couple. Deliberately conservative — this only covers CAD-originated
 * civilian calls; ER:LC-native events (robberies, high wanted stars) need
 * their own sizing once those flow in from the bot (see COORDINATION.md).
 */
export function unitsNeededForCallType(type: string): number {
  return type === "civil" ? 1 : 2;
}

/** Attaches each dispatched unit to the call and sets them enroute, and marks which call they're now tied to (drives the browser dispatch alert). */
export async function attachDispatchedUnits(callId: string, units: DispatchedUnit[]) {
  for (const u of units) {
    const row = await db.select().from(liveUnits).where(eq(liveUnits.callsignKey, u.callsignKey)).limit(1);
    const discordId = row[0]?.discordId;
    if (!discordId) continue;
    await assignUnitToCall(callId, discordId);
    await setUnitStatus(u.callsignKey, "enroute");
    await db.update(liveUnits).set({ callId, updatedAt: new Date() }).where(eq(liveUnits.callsignKey, u.callsignKey));
  }
}
