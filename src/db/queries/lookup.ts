import { ilike, or, eq } from "drizzle-orm";
import { db } from "@/db";
import { civilianProfiles, calls, citations, callsigns, vehicles, licences, characters, links } from "@/db/schema";
import { livePlayers } from "@/db/botOwnedTables";

/**
 * Name tab: the only Lookup tab with a real backing query today. Unions
 * matches across civilian profiles, calls, citations, and callsigns by
 * name/alias/callsign — the other six tabs have no backing data source
 * specified anywhere yet (see LookupWindow's inferred field lists).
 */
export async function lookupByName(query: string) {
  if (!query.trim()) return { civilians: [], calls: [], citations: [], callsigns: [] };
  const like = `%${query}%`;

  const civilianMatches = await db
    .select()
    .from(civilianProfiles)
    .where(or(ilike(civilianProfiles.alias, like), ilike(civilianProfiles.rpName, like)));

  const callMatches = await db.select().from(calls).where(ilike(calls.title, like));

  const citationMatches = await db.select().from(citations).where(ilike(citations.offense, like));

  const callsignMatches = await db.select().from(callsigns).where(ilike(callsigns.rank, like));

  return {
    civilians: civilianMatches,
    calls: callMatches,
    citations: citationMatches,
    callsigns: callsignMatches,
  };
}

export async function lookupVehicleByPlate(plate: string) {
  if (!plate.trim()) return [];
  return db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      make: vehicles.make,
      model: vehicles.model,
      colour: vehicles.colour,
      ownerFirstName: characters.firstName,
      ownerLastName: characters.lastName,
    })
    .from(vehicles)
    .innerJoin(characters, eq(vehicles.characterId, characters.id))
    .where(ilike(vehicles.plate, `%${plate}%`));
}

const ONLINE_WINDOW_MS = 90_000;

/**
 * ROBLOX tab: every player who has ever linked their account (the `links`
 * table — this is the "any player ever to exist on CAD" the user asked
 * for, not just people currently in-game), left-joined against the bot's
 * live_players cache so we can flag which of those matches are online
 * right now.
 */
export async function lookupPlayersByUsername(query: string) {
  if (!query.trim()) return [];
  const like = `%${query}%`;

  const rows = await db
    .select({
      discordId: links.discordId,
      robloxUsername: links.robloxUsername,
      robloxUserId: links.robloxUserId,
      liveUpdatedAt: livePlayers.updatedAt,
    })
    .from(links)
    .leftJoin(livePlayers, eq(links.robloxUsername, livePlayers.robloxUsername))
    .where(or(ilike(links.robloxUsername, like), ilike(links.robloxUserId, like)))
    .limit(50);

  const now = Date.now();
  return rows.map((r) => ({
    discordId: r.discordId,
    robloxUsername: r.robloxUsername,
    robloxUserId: r.robloxUserId,
    online: Boolean(r.liveUpdatedAt && now - new Date(r.liveUpdatedAt).getTime() < ONLINE_WINDOW_MS),
  }));
}

export async function lookupLicenceByHolderName(name: string) {
  if (!name.trim()) return [];
  const like = `%${name}%`;
  return db
    .select({
      id: licences.id,
      type: licences.type,
      status: licences.status,
      holderFirstName: characters.firstName,
      holderLastName: characters.lastName,
    })
    .from(licences)
    .innerJoin(characters, eq(licences.characterId, characters.id))
    .where(or(ilike(characters.firstName, like), ilike(characters.lastName, like)));
}
