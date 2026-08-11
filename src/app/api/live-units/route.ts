import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listLiveUnits, setUnitDuty, setUnitStatus } from "@/db/queries/liveUnits";
import { getUnitSession } from "@/lib/unitSession";
import { UNIT_STATUSES } from "@/lib/unitStatus";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const rows = await listLiveUnits();
  return NextResponse.json({ liveUnits: rows });
}

const patchSchema = z.object({
  onDuty: z.boolean().optional(),
  status: z.enum(UNIT_STATUSES).optional(),
});

/**
 * Today: the signed-in unit's own duty/status toggle upserts its own
 * live_units row directly. `onDuty` is nominally bot-controlled (actually
 * logged in with a matching in-game callsign) but the CAD can still flip it
 * locally for now; `status` (available/unavailable/busy/enroute/on_scene)
 * is CAD-only and always will be. Once BOT_SIDE_INSTRUCTIONS.md #3's poller
 * is the only writer of `onDuty`, this route's `status` half is unaffected.
 */
export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const unit = await getUnitSession();
  if (!unit) return NextResponse.json({ error: "no_active_unit" }, { status: 409 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const callsignKey = `${unit.department}-${unit.number}`;

  if (parsed.data.onDuty !== undefined) {
    await setUnitDuty({
      department: unit.department,
      number: unit.number,
      discordId: session.user.discordId,
      agency: unit.agency,
      subdivision: unit.subdivision,
      items: unit.items,
      onDuty: parsed.data.onDuty,
      status: parsed.data.status,
    });
  } else if (parsed.data.status) {
    await setUnitStatus(callsignKey, parsed.data.status);
  }

  return NextResponse.json({ ok: true });
}
