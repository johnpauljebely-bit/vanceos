import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getOrCreateCivilianProfile } from "@/db/queries/civilians";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const profile = await getOrCreateCivilianProfile(session.user.discordId);
  if (!profile) {
    return NextResponse.json({ error: "not_linked" }, { status: 409 });
  }
  return NextResponse.json({ profile });
}
