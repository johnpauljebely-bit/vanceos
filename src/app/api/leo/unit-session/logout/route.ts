import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { clearUnitSession, getUnitSession } from "@/lib/unitSession";
import { setUnitOffDutyByCallsign } from "@/db/queries/liveUnits";

export async function POST() {
  const { error } = await requireApiSession();
  if (error) return error;

  const current = await getUnitSession();
  if (current) {
    await setUnitOffDutyByCallsign(`${current.department}-${current.number}`);
  }

  await clearUnitSession();
  return NextResponse.json({ ok: true });
}
