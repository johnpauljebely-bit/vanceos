import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getOrCreateCivilianProfile } from "./civilians";

export async function listCharacters(civilianDiscordId: string) {
  return db.select().from(characters).where(eq(characters.civilianDiscordId, civilianDiscordId));
}

export async function getCharacter(id: number) {
  const rows = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface NewCharacterInput {
  civilianDiscordId: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  dateOfBirth: string;
  sex?: string;
  address?: string;
  phoneNumber?: string;
  linkedRobloxUsername?: string;
  skinColour?: string;
  hairColour?: string;
  eyeColour?: string;
  height?: string;
  weight?: string;
  ssn?: string;
  photoUrl?: string;
}

function generateSsn(): string {
  return String(Math.floor(10_000_000 + Math.random() * 89_999_999));
}

export async function createCharacter(input: NewCharacterInput) {
  const [character] = await db
    .insert(characters)
    .values({ ssn: generateSsn(), ...input })
    .returning();
  return character;
}

export async function updateCharacter(
  id: number,
  input: Partial<Omit<NewCharacterInput, "civilianDiscordId" | "linkedRobloxUsername" | "dateOfBirth">>,
) {
  const [character] = await db.update(characters).set(input).where(eq(characters.id, id)).returning();
  return character;
}

export async function regenerateSsn(id: number) {
  const [character] = await db.update(characters).set({ ssn: generateSsn() }).where(eq(characters.id, id)).returning();
  return character;
}

/**
 * Mirrors the auto-generated civilian_profiles identity (locked
 * alias/birthday, per the original brief) into a default Melonly-style
 * character on first access, so vehicles/licences always have something to
 * attach to even before the civilian creates any character themselves.
 */
export async function ensureDefaultCharacter(civilianDiscordId: string) {
  const existing = await listCharacters(civilianDiscordId);
  if (existing.length > 0) return existing[0];

  const profile = await getOrCreateCivilianProfile(civilianDiscordId);
  if (!profile) return null;

  const [first, ...rest] = profile.rpName.split(" ");
  return createCharacter({
    civilianDiscordId,
    firstName: first || profile.rpName,
    lastName: rest.join(" ") || "Doe",
    dateOfBirth: profile.birthday,
    sex: undefined,
    linkedRobloxUsername: profile.alias,
  });
}
