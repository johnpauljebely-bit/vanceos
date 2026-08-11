import { eq } from "drizzle-orm";
import { db } from "@/db";
import { links, civilianProfiles } from "@/db/schema";
import { deriveCivilianBirthday } from "@/lib/roblox";
import { generateRpName } from "@/lib/rpName";

export async function getLinkForDiscordId(discordId: string) {
  const rows = await db.select().from(links).where(eq(links.discordId, discordId)).limit(1);
  return rows[0] ?? null;
}

export async function getCivilianProfile(discordId: string) {
  const rows = await db
    .select()
    .from(civilianProfiles)
    .where(eq(civilianProfiles.discordId, discordId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Auto-generates a civilian identity off the EXISTING links table (the one
 * `;verify` writes to) — never asks for a Roblox username again. Alias and
 * birthday are locked at creation and never updated by any later call.
 */
export async function getOrCreateCivilianProfile(discordId: string) {
  const existing = await getCivilianProfile(discordId);
  if (existing) return existing;

  const link = await getLinkForDiscordId(discordId);
  if (!link) return null; // caller must show the "link your account first" state

  let birthdayDisplay = "01-01-2000"; // fallback if Roblox API is unreachable
  if (link.robloxUserId) {
    const birthday = await deriveCivilianBirthday(link.robloxUserId);
    if (birthday) birthdayDisplay = birthday.display;
  }

  const [profile] = await db
    .insert(civilianProfiles)
    .values({
      discordId,
      alias: link.robloxUsername,
      birthday: birthdayDisplay,
      gender: null, // chosen at /civilian/setup
      rpName: generateRpName(),
    })
    .returning();

  return profile;
}

export async function setCivilianGender(discordId: string, gender: string) {
  await db
    .update(civilianProfiles)
    .set({ gender, updatedAt: new Date() })
    .where(eq(civilianProfiles.discordId, discordId));
}

export async function updateCivilianProfile(
  discordId: string,
  fields: { rpName?: string; gender?: string },
) {
  await db
    .update(civilianProfiles)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(civilianProfiles.discordId, discordId));
}
