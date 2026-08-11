import { eq } from "drizzle-orm";
import { db } from "@/db";
import { citations, civilianProfiles } from "@/db/schema";

export async function listCitationsForCivilian(civilianDiscordId: string) {
  return db.select().from(citations).where(eq(citations.civilianDiscordId, civilianDiscordId));
}

export async function payCitation(citationId: number, civilianDiscordId: string) {
  const [citation] = await db.select().from(citations).where(eq(citations.id, citationId)).limit(1);
  if (!citation || citation.civilianDiscordId !== civilianDiscordId) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (citation.status === "paid") {
    return { ok: false as const, reason: "already_paid" as const };
  }

  const [profile] = await db
    .select()
    .from(civilianProfiles)
    .where(eq(civilianProfiles.discordId, civilianDiscordId))
    .limit(1);
  if (!profile) return { ok: false as const, reason: "no_profile" as const };

  const balance = Number(profile.balance);
  const amount = Number(citation.amount);
  if (balance < amount) {
    return { ok: false as const, reason: "insufficient_funds" as const };
  }

  await db
    .update(civilianProfiles)
    .set({ balance: (balance - amount).toFixed(2), updatedAt: new Date() })
    .where(eq(civilianProfiles.discordId, civilianDiscordId));
  await db
    .update(citations)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(citations.id, citationId));

  return { ok: true as const };
}
