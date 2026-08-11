import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getUnitSession } from "@/lib/unitSession";
import { findBestOnlineApprover, createSelfDispatchRequest } from "@/db/queries/selfDispatch";

export async function POST() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const unit = await getUnitSession();
  if (!unit) return NextResponse.json({ error: "no_active_unit" }, { status: 409 });

  const requesterCallsignKey = `${unit.department}-${unit.number}`;
  const approver = await findBestOnlineApprover(requesterCallsignKey);
  if (!approver || !approver.discordId) {
    return NextResponse.json({ error: "no_available_hr" }, { status: 404 });
  }

  const request = await createSelfDispatchRequest({
    requesterDiscordId: session.user.discordId,
    requesterCallsignKey,
    approverDiscordId: approver.discordId,
    approverCallsignKey: approver.callsignKey,
  });
  return NextResponse.json({ request });
}
