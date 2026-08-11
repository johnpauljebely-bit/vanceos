import { eq, inArray, ilike } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, characters } from "@/db/schema";

export async function listVehiclesForCivilian(civilianDiscordId: string) {
  const chars = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.civilianDiscordId, civilianDiscordId));
  const ids = chars.map((c) => c.id);
  if (ids.length === 0) return [];
  return db.select().from(vehicles).where(inArray(vehicles.characterId, ids));
}

export interface NewVehicleInput {
  characterId: number;
  plate: string;
  make?: string;
  model?: string;
  colour?: string;
}

export async function registerVehicle(input: NewVehicleInput) {
  const [vehicle] = await db.insert(vehicles).values(input).returning();
  return vehicle;
}

export async function searchVehiclesByPlate(query: string) {
  if (!query.trim()) return [];
  return db.select().from(vehicles).where(ilike(vehicles.plate, `%${query}%`));
}
