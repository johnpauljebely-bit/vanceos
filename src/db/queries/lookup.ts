import { ilike, or, eq } from "drizzle-orm";
import { db } from "@/db";
import { civilianProfiles, calls, citations, callsigns, vehicles, licences, characters } from "@/db/schema";

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
