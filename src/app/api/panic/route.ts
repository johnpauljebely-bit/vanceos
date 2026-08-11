import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { getUnitSession } from "@/lib/unitSession";
import { announceInGame } from "@/lib/announce";
import { upsertLeoCall } from "@/db/queries/calls";

const schema = z.object({ postal: z.string().min(1).max(20) });

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const unit = await getUnitSession();
  if (!unit) return NextResponse.json({ error: "no_active_unit" }, { status: 409 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { postal } = parsed.data;

  // Panic shows up on the Calls board like any other active call, so other
  // units can see it and attach — not just an in-game broadcast.
  const call = await upsertLeoCall({
    status: "dispatched",
    type: "panic",
    title: `Panic — Unit ${unit.number}`,
    panels: "All",
    priority: "high",
    postal,
    description: `Officer needs help. Unit ${unit.number} at postal ${postal}.`,
    department: unit.department,
    primaryUnitCallsign: String(unit.number),
    createdBy: session.user.discordId,
  });

  const result = await announceInGame(`All units hold traffic, officer needs help. ${unit.number} at ${postal}.`);
  return NextResponse.json({ announced: result.ok, call });
}
