import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { callsigns } from "@/db/schema";

export async function listCallsignsForUser(discordId: string, department: string) {
  return db
    .select()
    .from(callsigns)
    .where(and(eq(callsigns.discordId, discordId), eq(callsigns.department, department)));
}

/** department='ownership' (100-199) — unlocks full CAD access across every department. */
export async function hasOwnershipCallsign(discordId: string): Promise<boolean> {
  return (await getOwnershipCallsign(discordId)) !== null;
}

export async function getOwnershipCallsign(discordId: string) {
  const rows = await db
    .select()
    .from(callsigns)
    .where(and(eq(callsigns.discordId, discordId), eq(callsigns.department, "ownership")))
    .limit(1);
  return rows[0] ?? null;
}

/** All units this Discord user holds, across every department — backs the Unit Manager. */
export async function listAllCallsignsForUser(discordId: string) {
  return db.select().from(callsigns).where(eq(callsigns.discordId, discordId));
}

/**
 * Re-validates a unit-session cookie against CURRENT data — a cookie can
 * outlive the callsign it points at (removed, reassigned, ownership
 * revoked), and the CAD page must never trust a stale claim just because
 * the cookie says so. True if `department`/`number` is either a real row
 * this discordId still holds in that exact department, or matches their
 * current ownership number (the "unlock everything" stand-in identity).
 */
export async function isUnitOwnedByUser(discordId: string, department: string, number: number): Promise<boolean> {
  const owned = await listCallsignsForUser(discordId, department);
  if (owned.some((c) => c.number === number)) return true;
  const ownership = await getOwnershipCallsign(discordId);
  return ownership?.number === number;
}

/**
 * Delta PD self-chosen callsign claim. Per the brief: 400-499, self-chosen,
 * just needs to be unique and in range — not looked up from a pre-existing
 * `/callsign`-assigned row like rcmp/bchp (the bot has no self-assign code
 * path for Delta PD yet). Writes into the SAME `callsigns` table shape so
 * there's one system of record once the bot does implement that flow —
 * see BOT_SIDE_INSTRUCTIONS.md.
 */
export async function claimDeltaPdCallsign(
  discordId: string,
  number: number,
): Promise<{ ok: true } | { ok: false; reason: "taken" }> {
  const existing = await db
    .select()
    .from(callsigns)
    .where(and(eq(callsigns.department, "delta-pd"), eq(callsigns.number, number)))
    .limit(1);

  if (existing[0] && existing[0].discordId !== discordId) {
    return { ok: false, reason: "taken" };
  }

  await db
    .insert(callsigns)
    .values({
      department: "delta-pd",
      number,
      rank: "Officer",
      discordId,
      assignedAt: new Date().toISOString(),
      assignedBy: discordId, // self-chosen
    })
    .onConflictDoUpdate({
      target: [callsigns.department, callsigns.number],
      set: { discordId, assignedAt: new Date().toISOString(), assignedBy: discordId },
    });

  return { ok: true };
}
