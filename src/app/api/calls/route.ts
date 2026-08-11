import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { listActiveCalls, listAllCalls, upsertLeoCall, assignUnitToCall } from "@/db/queries/calls";
import { getUnitSession } from "@/lib/unitSession";
import { callIntakeSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const status = request.nextUrl.searchParams.get("status");
  if (status === "all") {
    const { active, closed } = await listAllCalls();
    return NextResponse.json({ active, closed });
  }

  const activeCalls = await listActiveCalls();
  return NextResponse.json({ calls: activeCalls });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const unit = await getUnitSession();
  if (!unit) return NextResponse.json({ error: "no_active_unit" }, { status: 409 });

  const parsed = callIntakeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { assignSelf, ...rest } = parsed.data;
  const call = await upsertLeoCall({
    ...rest,
    department: unit.department,
    createdBy: session.user.discordId,
  });

  if (assignSelf) {
    await assignUnitToCall(call.id, session.user.discordId);
  }

  return NextResponse.json({ call });
}
