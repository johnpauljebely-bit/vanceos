import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { getCharacter, updateCharacter } from "@/db/queries/characters";

const patchSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  middleInitial: z.string().max(5).optional(),
  lastName: z.string().min(1).max(60).optional(),
  sex: z.enum(["Male", "Female"]).optional(),
  address: z.string().max(200).optional(),
  phoneNumber: z.string().max(30).optional(),
  skinColour: z.string().max(40).optional(),
  hairColour: z.string().max(40).optional(),
  eyeColour: z.string().max(40).optional(),
  height: z.string().max(20).optional(),
  weight: z.string().max(20).optional(),
  photoUrl: z.string().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const character = await getCharacter(Number(id));
  if (!character || character.civilianDiscordId !== session.user.discordId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateCharacter(Number(id), parsed.data);
  return NextResponse.json({ character: updated });
}
