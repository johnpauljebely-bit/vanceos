import { eq } from "drizzle-orm";
import { db } from "@/db";
import { liveUnits } from "@/db/schema";
import type { UnitStatus } from "@/lib/unitStatus";

export async function listLiveUnits() {
  return db.select().from(liveUnits);
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

export async function getLiveUnit(callsignKey: string) {
  const rows = await db.select().from(liveUnits).where(eq(liveUnits.callsignKey, callsignKey)).limit(1);
  return rows[0] ?? null;
}
