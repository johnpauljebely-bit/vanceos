import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getUnitSession } from "@/lib/unitSession";
import { removeUnitFromAllCalls } from "@/db/queries/calls";
import { setUnitStatus } from "@/db/queries/liveUnits";

/** Self Clear: detach from every call this unit is on, and go available. */
export async function POST() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const unit = await getUnitSession();
  if (!unit) return NextResponse.json({ error: "no_active_unit" }, { status: 409 });

  await removeUnitFromAllCalls(session.user.discordId);
  await setUnitStatus(`${unit.department}-${unit.number}`, "available");

  return NextResponse.json({ ok: true });
}
