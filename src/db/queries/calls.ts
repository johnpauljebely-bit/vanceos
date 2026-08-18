import { and, desc, eq, gt, lt, isNull, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { calls, callNotes, callUnits, liveUnits } from "@/db/schema";

// A call left open this long without being cleared almost certainly isn't
// actually being worked — auto-archive it as "incomplete" rather than
// letting it sit in Active forever. Enforced at read-time (query-time),
// not a background job — this app has no cron infra, so every call to
// listActiveCalls() is also the trigger to sweep anything gone stale.
const STALE_CALL_MS = 30 * 60 * 1000;

async function archiveStaleCalls() {
  const cutoff = new Date(Date.now() - STALE_CALL_MS).toISOString();
  await db
    .update(calls)
    .set({ clearedAt: new Date().toISOString(), status: "incomplete", clearedBy: "Auto-archived" })
    .where(and(isNull(calls.clearedAt), lt(calls.createdAt, cutoff)));
}

export async function listActiveCalls() {
  await archiveStaleCalls();
  return db.select().from(calls).where(isNull(calls.clearedAt)).orderBy(desc(calls.createdAt));
}

const ARCHIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Archived calls — cleared within the last 7 days, per the user's ask ("archives...up to 7 days ago"). */
export async function listClosedCalls() {
  const cutoff = new Date(Date.now() - ARCHIVE_WINDOW_MS).toISOString();
  return db
    .select()
    .from(calls)
    .where(and(isNotNull(calls.clearedAt), gt(calls.clearedAt, cutoff)))
    .orderBy(desc(calls.clearedAt))
    .limit(100);
}

/** Melonly-style Calls board: every Active call plus recent Closed ones. */
export async function listAllCalls() {
  const [active, closed] = await Promise.all([listActiveCalls(), listClosedCalls()]);
  return { active, closed };
}

export async function reopenCall(callId: string) {
  await db.update(calls).set({ clearedAt: null, status: "dispatched" }).where(eq(calls.id, callId));
}

export async function getCall(id: string) {
  const rows = await db.select().from(calls).where(eq(calls.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createCivilian911Call(input: {
  postal: string;
  type: string;
  priority: string;
  description: string;
  civilianDiscordId: string;
  robloxUsername: string;
}) {
  const id = nanoid();
  const [call] = await db
    .insert(calls)
    .values({
      id,
      title: `911 — ${input.robloxUsername}`,
      description: input.description,
      postal: input.postal,
      type: input.type,
      priority: input.priority,
      source: "caller",
      status: "new",
      civilianDiscordId: input.civilianDiscordId,
      panels: "All",
      createdAt: new Date().toISOString(),
    })
    .returning();
  return call;
}

export interface CallIntakeInput {
  id?: string;
  status: string;
  type?: string;
  origin?: string;
  primaryUnitCallsign?: string;
  title: string;
  panels: string;
  code?: string;
  priority?: string;
  postal?: string;
  address?: string;
  description?: string;
  department?: string;
  createdBy: string;
}

export async function upsertLeoCall(input: CallIntakeInput) {
  if (input.id) {
    const [updated] = await db
      .update(calls)
      .set({
        status: input.status,
        type: input.type,
        origin: input.origin,
        primaryUnitCallsign: input.primaryUnitCallsign,
        title: input.title,
        panels: input.panels,
        code: input.code,
        priority: input.priority,
        postal: input.postal,
        address: input.address,
        description: input.description,
        department: input.department,
      })
      .where(eq(calls.id, input.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(calls)
    .values({
      id: nanoid(),
      status: input.status,
      type: input.type,
      origin: input.origin,
      primaryUnitCallsign: input.primaryUnitCallsign,
      title: input.title,
      panels: input.panels,
      code: input.code,
      priority: input.priority,
      postal: input.postal,
      address: input.address,
      description: input.description,
      department: input.department,
      source: "leo",
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    })
    .returning();
  return created;
}

export async function clearCall(callId: string, clearedBy?: string) {
  await db
    .update(calls)
    .set({ clearedAt: new Date().toISOString(), status: "cleared", clearedBy })
    .where(eq(calls.id, callId));
}

export async function assignUnitToCall(callId: string, discordId: string) {
  await db
    .insert(callUnits)
    .values({ callId, discordId, assignedAt: new Date().toISOString() })
    .onConflictDoNothing();
}

export async function getActiveCallForUnit(discordId: string) {
  const rows = await db
    .select({ call: calls })
    .from(callUnits)
    .innerJoin(calls, eq(callUnits.callId, calls.id))
    .where(eq(callUnits.discordId, discordId));
  return rows.map((r) => r.call).find((c) => !c.clearedAt) ?? null;
}

export async function isUnitAttachedToCall(callId: string, discordId: string) {
  const rows = await db
    .select()
    .from(callUnits)
    .where(and(eq(callUnits.callId, callId), eq(callUnits.discordId, discordId)))
    .limit(1);
  return rows.length > 0;
}

export async function removeUnitFromCall(callId: string, discordId: string) {
  await db.delete(callUnits).where(and(eq(callUnits.callId, callId), eq(callUnits.discordId, discordId)));
}

/** Self Clear: detach a unit from every call they're currently attached to, not just one. */
export async function removeUnitFromAllCalls(discordId: string) {
  await db.delete(callUnits).where(eq(callUnits.discordId, discordId));
}

export async function appendCallNote(input: {
  callId: string;
  noteType: string;
  noteText: string;
  authorDiscordId: string;
}) {
  const [note] = await db.insert(callNotes).values(input).returning();
  return note;
}

export async function listCallNotes(callId: string) {
  return db.select().from(callNotes).where(eq(callNotes.callId, callId)).orderBy(callNotes.createdAt);
}

/** callId -> callsign keys currently attached, for the Map's call hover tooltip. */
export async function listCallUnitAssignments(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ callId: callUnits.callId, callsignKey: liveUnits.callsignKey })
    .from(callUnits)
    .innerJoin(liveUnits, eq(callUnits.discordId, liveUnits.discordId));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.callId);
    if (existing) existing.push(row.callsignKey);
    else map.set(row.callId, [row.callsignKey]);
  }
  return map;
}
