import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listCitationsForCivilian, payCitation } from "@/db/queries/citations";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const citationList = await listCitationsForCivilian(session.user.discordId);
  return NextResponse.json({ citations: citationList });
}

const paySchema = z.object({ citationId: z.number().int() });

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = paySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await payCitation(parsed.data.citationId, session.user.discordId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
