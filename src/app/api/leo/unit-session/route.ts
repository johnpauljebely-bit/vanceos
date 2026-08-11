import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listCallsignsForUser, claimDeltaPdCallsign, getOwnershipCallsign } from "@/db/queries/callsigns";
import { getLinkForDiscordId } from "@/db/queries/civilians";
import { getLivePlayerByUsername } from "@/db/queries/livePlayers";
import { setUnitSession } from "@/lib/unitSession";
import { DELTA_PD_CALLSIGN_RANGE } from "@/lib/roles";

const schema = z.object({
  department: z.string().min(1),
  number: z.number().int(),
  rpName: z.string().min(1).max(60),
  agency: z.string().max(60).optional(),
  subdivision: z.string().max(60).optional(),
  items: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { department, number } = parsed.data;

  if (department === "delta-pd") {
    if (number < DELTA_PD_CALLSIGN_RANGE.min || number > DELTA_PD_CALLSIGN_RANGE.max) {
      return NextResponse.json({ error: "out_of_range" }, { status: 400 });
    }
    // Never trust the client's claim here either — the number must match
    // what ER:LC is currently reporting as this player's live callsign.
    const link = await getLinkForDiscordId(session.user.discordId);
    const live = link ? await getLivePlayerByUsername(link.robloxUsername) : null;
    const online = Boolean(live && Date.now() - new Date(live.updatedAt).getTime() < 90_000);
    if (!online || live?.callsign !== String(number)) {
      return NextResponse.json({ error: "not_live" }, { status: 409 });
    }
    const claim = await claimDeltaPdCallsign(session.user.discordId, number);
    if (!claim.ok) {
      return NextResponse.json({ error: claim.reason }, { status: 409 });
    }
  } else {
    // RCMP/BCHP: the callsign must actually belong to this Discord user in
    // the (bot-owned) callsigns table for this exact department — OR they
    // hold an `ownership` row with this exact number, standing in as their
    // identity for a department they don't otherwise have a unit in
    // ("unlock everything" — confirmed with the user).
    const owned = await listCallsignsForUser(session.user.discordId, department);
    const match = owned.find((c) => c.number === number);
    if (!match) {
      const ownership = await getOwnershipCallsign(session.user.discordId);
      if (!ownership || ownership.number !== number) {
        return NextResponse.json({ error: "callsign_not_owned" }, { status: 403 });
      }
    }
  }

  await setUnitSession(parsed.data);
  return NextResponse.json({ ok: true });
}
