import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getUnitSession } from "@/lib/unitSession";
import { assignUnitToCall } from "@/db/queries/calls";
import { setUnitStatus } from "@/db/queries/liveUnits";

/** Anyone can attach themselves to any active call — joining also flips their live status to enroute. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  await assignUnitToCall(id, session.user.discordId);

  const unit = await getUnitSession();
  if (unit) {
    await setUnitStatus(`${unit.department}-${unit.number}`, "enroute");
  }

  return NextResponse.json({ ok: true, status: unit ? "enroute" : null });
}
