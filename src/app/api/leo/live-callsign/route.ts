import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getLinkForDiscordId } from "@/db/queries/civilians";
import { getLivePlayerByUsername } from "@/db/queries/livePlayers";

/**
 * Delta PD onboarding: what does ER:LC currently say this player's
 * in-game callsign is right now, if they're online? Independent of any
 * `callsigns` row — see BOT_SIDE_INSTRUCTIONS.md #6.
 */
export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const link = await getLinkForDiscordId(session.user.discordId);
  if (!link) return NextResponse.json({ online: false, callsign: null });

  const live = await getLivePlayerByUsername(link.robloxUsername);
  const online = Boolean(live && Date.now() - new Date(live.updatedAt).getTime() < 90_000);
  return NextResponse.json({ online, callsign: online ? (live?.callsign ?? null) : null });
}
