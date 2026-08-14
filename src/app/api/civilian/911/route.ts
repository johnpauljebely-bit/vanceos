import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getLinkForDiscordId } from "@/db/queries/civilians";
import { createCivilian911Call } from "@/db/queries/calls";
import { findNearestAvailableUnits, attachDispatchedUnits, unitsNeededForCallType } from "@/db/queries/dispatch";
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

  // Civilian calls have no requesting officer to prefer/exclude around —
  // just the nearest available units across every department. Sized small
  // on purpose: a 311 report shouldn't pull in everyone, a real 911 gets a
  // couple (see unitsNeededForCallType).
  const dispatchedUnits = call.id
    ? await findNearestAvailableUnits({
        count: unitsNeededForCallType(type),
        targetPostal: postal,
      })
    : [];
  if (call.id && dispatchedUnits.length > 0) {
    await attachDispatchedUnits(call.id, dispatchedUnits);
  }

  // Never let the (currently nonexistent) bot endpoint block the call record.
  const announceResult = await announceInGame(
    type === "civil"
      ? `311 non-emergency report from postal ${postal} from ${link.robloxUsername}. Caller says ${description}. Respond when available.`
      : `Attention, 911 call coming from postal ${postal} from ${link.robloxUsername}. Caller says ${description}. One available unit please respond.`,
  );

  return NextResponse.json({ call, announced: announceResult.ok, dispatchedUnits });
}
