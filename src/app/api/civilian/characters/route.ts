import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listCharacters, createCharacter, ensureDefaultCharacter } from "@/db/queries/characters";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  await ensureDefaultCharacter(session.user.discordId);
  const rows = await listCharacters(session.user.discordId);
  return NextResponse.json({ characters: rows });
}

const characterSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  dateOfBirth: z.string().min(1),
  sex: z.enum(["Male", "Female"]).optional(),
  address: z.string().max(200).optional(),
  phoneNumber: z.string().max(30).optional(),
  linkedRobloxUsername: z.string().max(60).optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = characterSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const character = await createCharacter({ civilianDiscordId: session.user.discordId, ...parsed.data });
  return NextResponse.json({ character });
}
