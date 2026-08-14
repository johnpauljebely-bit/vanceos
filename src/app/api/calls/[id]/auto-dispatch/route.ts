import { NextResponse } from "next/server";
import { z } from "zod";
import { getCall } from "@/db/queries/calls";
import { findNearestAvailableUnits, attachDispatchedUnits } from "@/db/queries/dispatch";

const schema = z.object({
  count: z.number().int().min(1).max(20),
  preferredDepartment: z.string().optional(),
});

/**
 * Internal, bot-to-CAD only (not a browser session route) — lets the bot
 * trigger real nearest-unit dispatch for any call it creates (e.g. an
 * under-threshold ER:LC-native robbery), reusing the same logic Traffic
 * Stop and 911/311 use. Auth via shared secret header, mirroring how the
 * CAD calls the bot's own /internal/announce.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const secret = request.headers.get("X-Internal-Secret");
  if (!secret || secret !== process.env.CAD_INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const call = await getCall(id);
  if (!call) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!call.postal) return NextResponse.json({ error: "no_postal_on_call" }, { status: 400 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const dispatchedUnits = await findNearestAvailableUnits({
    count: parsed.data.count,
    targetPostal: call.postal,
    preferredDepartment: parsed.data.preferredDepartment,
  });
  await attachDispatchedUnits(call.id, dispatchedUnits);

  return NextResponse.json({ dispatchedUnits });
}
