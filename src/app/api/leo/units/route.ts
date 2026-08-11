import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { listAllCallsignsForUser } from "@/db/queries/callsigns";
import { listLiveUnitsForUser } from "@/db/queries/liveUnits";

/** Backs the Unit Manager — every unit this Discord user holds, across all departments. */
export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const [callsignRows, liveRows] = await Promise.all([
    listAllCallsignsForUser(session.user.discordId),
    listLiveUnitsForUser(session.user.discordId),
  ]);

  const liveByKey = new Map(liveRows.map((r) => [r.callsignKey, r]));

  const units = callsignRows.map((c) => {
    const key = `${c.department}-${c.number}`;
    const live = liveByKey.get(key);
    return {
      department: c.department,
      number: c.number,
      rank: c.rank,
      agency: live?.agency ?? null,
      subdivision: live?.subdivision ?? null,
      items: live?.items ?? null,
    };
  });

  return NextResponse.json({ units });
}
