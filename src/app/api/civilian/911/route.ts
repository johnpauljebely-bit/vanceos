import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getLinkForDiscordId } from "@/db/queries/civilians";
import { createCivilian911Call } from "@/db/queries/calls";
import { announceInGame } from "@/lib/announce";
import { nineOneOneSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = nineOneOneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const link = await getLinkForDiscordId(session.user.discordId);
  if (!link) return NextResponse.json({ error: "not_linked" }, { status: 409 });

  const { postal, type, priority, description } = parsed.data;
  const call = await createCivilian911Call({
    postal,
    type,
    priority,
    description,
    civilianDiscordId: session.user.discordId,
    robloxUsername: link.robloxUsername,
  });

  // Never let the (currently nonexistent) bot endpoint block the call record.
  const announceResult = await announceInGame(
    type === "civil"
      ? `311 non-emergency report from postal ${postal} from ${link.robloxUsername}. Caller says ${description}. Respond when available.`
      : `Attention, 911 call coming from postal ${postal} from ${link.robloxUsername}. Caller says ${description}. One available unit please respond.`,
  );

  return NextResponse.json({ call, announced: announceResult.ok });
}
