import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listVehiclesForCivilian, registerVehicle } from "@/db/queries/vehicles";
import { getCharacter } from "@/db/queries/characters";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const rows = await listVehiclesForCivilian(session.user.discordId);
  return NextResponse.json({ vehicles: rows });
}

const vehicleSchema = z.object({
  characterId: z.number().int(),
  plate: z.string().min(1).max(20),
  make: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  colour: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = vehicleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Never trust the client's characterId claim — it must belong to this civilian.
  const character = await getCharacter(parsed.data.characterId);
  if (!character || character.civilianDiscordId !== session.user.discordId) {
    return NextResponse.json({ error: "character_not_owned" }, { status: 403 });
  }

  try {
    const vehicle = await registerVehicle(parsed.data);
    return NextResponse.json({ vehicle });
  } catch {
    return NextResponse.json({ error: "plate_taken" }, { status: 409 });
  }
}
