import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { recordCadActivity } from "@/db/queries/cadActivity";

/** Called periodically by an open CAD dashboard so the bot's reminder poller can tell "here right now" from "on duty, never opened it." */
export async function POST() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  await recordCadActivity(session.user.discordId);
  return NextResponse.json({ ok: true });
}
