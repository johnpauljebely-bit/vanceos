import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { getUnitSession } from "@/lib/unitSession";
import { announceInGame } from "@/lib/announce";
import { toNatoPhonetic } from "@/lib/nato";
import { upsertLeoCall } from "@/db/queries/calls";
import { findNearestAvailableUnits, attachDispatchedUnits } from "@/db/queries/dispatch";

const schema = z.object({
  vehicleDescription: z.string().min(1).max(200),
  plate: z.string().min(1).max(20),
  postal: z.string().min(1).max(20),
  needsAdditional: z.boolean(),
  additionalUnitsCount: z.number().int().min(1).max(10).optional(),
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

  const { vehicleDescription, plate, postal, needsAdditional, additionalUnitsCount } = parsed.data;
  const suffix = needsAdditional
    ? `Requesting ${additionalUnitsCount ?? 1} additional unit${(additionalUnitsCount ?? 1) > 1 ? "s" : ""}.`
    : "No additional units needed.";
  const message = `Traffic stop, unit ${unit.number}, vehicle ${vehicleDescription}, plate ${plate}, postal ${postal}. ${suffix}`;
  // Spoken version reads the plate in NATO phonetics so it's actually
  // intelligible over voice, per the user's ask (same convention as BOLO).
  const spokenMessage = `Traffic stop, unit ${unit.number}, vehicle ${vehicleDescription}, plate ${toNatoPhonetic(plate)}, postal ${postal}. ${suffix}`;

  // Shows up on the Calls board like any other active call — especially
  // important when additional units are needed, so others can see and join.
  const call = await upsertLeoCall({
    status: "dispatched",
    type: "traffic_stop",
    title: `Traffic Stop — ${plate}`,
    panels: "All",
    priority: needsAdditional ? "high" : "medium",
    postal,
    description: `${vehicleDescription}, plate ${plate}.${needsAdditional ? ` ${suffix}` : ""}`,
    department: unit.department,
    primaryUnitCallsign: String(unit.number),
    createdBy: session.user.discordId,
  });

  let dispatchedUnits: Awaited<ReturnType<typeof findNearestAvailableUnits>> = [];
  if (needsAdditional && additionalUnitsCount && call.id) {
    dispatchedUnits = await findNearestAvailableUnits({
      excludeDiscordId: session.user.discordId,
      preferredDepartment: unit.department,
      count: additionalUnitsCount,
      targetPostal: postal,
    });
    await attachDispatchedUnits(call.id, dispatchedUnits);
  }

  const result = await announceInGame(message, spokenMessage);
  return NextResponse.json({ announced: result.ok, call, dispatchedUnits });
}
