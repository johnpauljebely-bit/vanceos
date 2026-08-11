import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { listCallsignsForUser } from "@/db/queries/callsigns";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const department = request.nextUrl.searchParams.get("department");
  if (!department) return NextResponse.json({ error: "missing_department" }, { status: 400 });

  const rows = await listCallsignsForUser(session.user.discordId, department);
  return NextResponse.json({ callsigns: rows });
}
