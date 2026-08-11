import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getCall } from "@/db/queries/calls";
import { announceInGame } from "@/lib/announce";

/** "Automations" → Broadcast Call Update: re-announce the call's current state to all units. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const call = await getCall(id);
  if (!call) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parts = [
    `Update on ${call.title ?? "active call"}`,
    call.status ? `status ${call.status.replace("_", " ")}` : null,
    call.postal ? `postal ${call.postal}` : null,
    call.primaryUnitCallsign ? `primary unit ${call.primaryUnitCallsign}` : null,
  ].filter(Boolean);

  const result = await announceInGame(parts.join(", ") + ".");
  return NextResponse.json({ announced: result.ok });
}
