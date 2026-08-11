import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { liveUnits, selfDispatchRequests } from "@/db/schema";

/**
 * Eligible Self Dispatch approvers, per the user: ownership (100-199), or
 * rcmp/bchp 1000-1199 / 2000-2199 (Inspector and above in both
 * departments). Ranked best-first: ownership outranks everyone, then lower
 * numbers outrank higher ones within a department's eligible band
 * (Commissioner/Superintendent 1000-1099 > Inspector 1100-1199, etc).
 */
function approverPriority(department: string, number: number): number | null {
  if (department === "ownership" && number >= 100 && number <= 199) return number; // 100-199, best tier
  if (department === "rcmp" && number >= 1000 && number <= 1199) return 1000 + number; // 2000-2199 range
  if (department === "bchp" && number >= 2000 && number <= 2199) return 3000 + number; // 5000-5199 range
  return null;
}

export async function findBestOnlineApprover(excludeCallsignKey: string) {
  const rows = await db.select().from(liveUnits).where(eq(liveUnits.onDuty, true));
  const candidates = rows
    .filter((r) => r.callsignKey !== excludeCallsignKey && r.discordId)
    .map((r) => ({ row: r, priority: approverPriority(r.department, r.number) }))
    .filter((c): c is { row: (typeof rows)[number]; priority: number } => c.priority !== null)
    .sort((a, b) => a.priority - b.priority);

  return candidates[0]?.row ?? null;
}

export async function createSelfDispatchRequest(input: {
  requesterDiscordId: string;
  requesterCallsignKey: string;
  approverDiscordId: string;
  approverCallsignKey: string;
}) {
  const [request] = await db.insert(selfDispatchRequests).values(input).returning();
  return request;
}

export async function getPendingRequestForApprover(approverDiscordId: string) {
  const rows = await db
    .select()
    .from(selfDispatchRequests)
    .where(and(eq(selfDispatchRequests.approverDiscordId, approverDiscordId), eq(selfDispatchRequests.status, "pending")))
    .orderBy(desc(selfDispatchRequests.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLatestRequestForRequester(requesterDiscordId: string) {
  const rows = await db
    .select()
    .from(selfDispatchRequests)
    .where(eq(selfDispatchRequests.requesterDiscordId, requesterDiscordId))
    .orderBy(desc(selfDispatchRequests.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRequestById(id: number) {
  const rows = await db.select().from(selfDispatchRequests).where(eq(selfDispatchRequests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function resolveSelfDispatchRequest(id: number, approved: boolean) {
  const [request] = await db
    .update(selfDispatchRequests)
    .set({ status: approved ? "approved" : "denied", resolvedAt: new Date() })
    .where(eq(selfDispatchRequests.id, id))
    .returning();
  return request;
}
