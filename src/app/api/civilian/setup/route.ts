import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { setCivilianGender, updateCivilianProfile } from "@/db/queries/civilians";

const setupSchema = z.object({
  gender: z.string().min(1).max(40),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = setupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  await setCivilianGender(session.user.discordId, parsed.data.gender);
  return NextResponse.json({ ok: true });
}

const profileSchema = z.object({
  rpName: z.string().min(1).max(60).optional(),
  gender: z.string().min(1).max(40).optional(),
});

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  await updateCivilianProfile(session.user.discordId, parsed.data);
  return NextResponse.json({ ok: true });
}
