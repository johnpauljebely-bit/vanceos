import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { unitProfiles } from "@/db/schema";

const MAX_PROFILES_PER_DEPARTMENT = 3;

export async function listUnitProfiles(discordId: string, department: string) {
  return db
    .select()
    .from(unitProfiles)
    .where(and(eq(unitProfiles.discordId, discordId), eq(unitProfiles.department, department)));
}

export async function createUnitProfile(input: {
  discordId: string;
  department: string;
  rpName: string;
  agency?: string;
  subdivision?: string;
  items?: string;
}): Promise<{ ok: true; profile: typeof unitProfiles.$inferSelect } | { ok: false; reason: "limit_reached" }> {
  const existing = await listUnitProfiles(input.discordId, input.department);
  if (existing.length >= MAX_PROFILES_PER_DEPARTMENT) {
    return { ok: false, reason: "limit_reached" };
  }
  const [profile] = await db.insert(unitProfiles).values(input).returning();
  return { ok: true, profile };
}
