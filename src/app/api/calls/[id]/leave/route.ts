import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { removeUnitFromCall } from "@/db/queries/calls";

/** Leave a call without clearing it for everyone else attached — distinct from Self Clear/clear. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  await removeUnitFromCall(id, session.user.discordId);
  return NextResponse.json({ ok: true });
}
