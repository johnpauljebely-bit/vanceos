import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { getUnitSession } from "@/lib/unitSession";
import { announceInGame } from "@/lib/announce";
import { upsertLeoCall } from "@/db/queries/calls";

const schema = z.object({
  vehicleDescription: z.string().min(1).max(200),
  plate: z.string().min(1).max(20),
  postal: z.string().min(1).max(20),
  needsAdditional: z.boolean(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const unit = await getUnitSession();
  if (!unit) return NextResponse.json({ error: "no_active_unit" }, { status: 409 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { vehicleDescription, plate, postal, needsAdditional } = parsed.data;
  const message =
    `Traffic stop, unit ${unit.number}, vehicle ${vehicleDescription}, plate ${plate}, postal ${postal}. ` +
    (needsAdditional ? "Requesting additional units." : "No additional units needed.");

  // Shows up on the Calls board like any other active call — especially
  // important when additional units are needed, so others can see and join.
  const call = await upsertLeoCall({
    status: "dispatched",
    type: "traffic_stop",
    title: `Traffic Stop — ${plate}`,
    panels: "All",
    priority: needsAdditional ? "high" : "medium",
    postal,
    description: `${vehicleDescription}, plate ${plate}.${needsAdditional ? " Requesting additional units." : ""}`,
    department: unit.department,
    primaryUnitCallsign: String(unit.number),
    createdBy: session.user.discordId,
  });

  const result = await announceInGame(message);
  return NextResponse.json({ announced: result.ok, call });
}
