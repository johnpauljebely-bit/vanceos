import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { licences, characters } from "@/db/schema";

export async function listLicencesForCivilian(civilianDiscordId: string) {
  const chars = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.civilianDiscordId, civilianDiscordId));
  const ids = chars.map((c) => c.id);
  if (ids.length === 0) return [];
  return db.select().from(licences).where(inArray(licences.characterId, ids));
}

export async function applyForLicence(characterId: number, type: string) {
  const [licence] = await db.insert(licences).values({ characterId, type }).returning();
  return licence;
}
