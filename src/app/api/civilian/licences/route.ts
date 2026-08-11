import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listLicencesForCivilian, applyForLicence } from "@/db/queries/licences";
import { getCharacter } from "@/db/queries/characters";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const rows = await listLicencesForCivilian(session.user.discordId);
  return NextResponse.json({ licences: rows });
}

const licenceSchema = z.object({
  characterId: z.number().int(),
  type: z.string().min(1).max(40).default("Driver"),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = licenceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const character = await getCharacter(parsed.data.characterId);
  if (!character || character.civilianDiscordId !== session.user.discordId) {
    return NextResponse.json({ error: "character_not_owned" }, { status: 403 });
  }

  const licence = await applyForLicence(parsed.data.characterId, parsed.data.type);
  return NextResponse.json({ licence });
}
