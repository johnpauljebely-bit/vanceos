import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listUnitProfiles, createUnitProfile } from "@/db/queries/unitProfiles";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const department = request.nextUrl.searchParams.get("department");
  if (!department) {
    return NextResponse.json({ error: "missing_department" }, { status: 400 });
  }

  const profiles = await listUnitProfiles(session.user.discordId, department);
  return NextResponse.json({ profiles });
}

const schema = z.object({
  department: z.string().min(1),
  rpName: z.string().min(1).max(60),
  agency: z.string().max(60).optional(),
  subdivision: z.string().max(60).optional(),
  items: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createUnitProfile({ discordId: session.user.discordId, ...parsed.data });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json({ profile: result.profile });
}
