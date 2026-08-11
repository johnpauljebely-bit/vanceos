import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listActiveBolos, createBolo } from "@/db/queries/warrants";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const rows = await listActiveBolos();
  return NextResponse.json({ bolos: rows });
}

const boloSchema = z.object({
  subjectName: z.string().max(100).optional(),
  description: z.string().min(1).max(500),
  type: z.enum(["arrest", "general"]).default("general"),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = boloSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const bolo = await createBolo({ ...parsed.data, issuedBy: session.user.discordId });
  return NextResponse.json({ bolo });
}
