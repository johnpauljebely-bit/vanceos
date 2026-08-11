import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getCharacter, regenerateSsn } from "@/db/queries/characters";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const character = await getCharacter(Number(id));
  if (!character || character.civilianDiscordId !== session.user.discordId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await regenerateSsn(Number(id));
  return NextResponse.json({ character: updated });
}
