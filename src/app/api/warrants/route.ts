import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listActiveWarrants, createWarrant } from "@/db/queries/warrants";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const rows = await listActiveWarrants();
  return NextResponse.json({ warrants: rows });
}

const warrantSchema = z.object({
  subjectName: z.string().min(1).max(100),
  charges: z.string().min(1).max(500),
  signature: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = warrantSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const warrant = await createWarrant({ ...parsed.data, issuedBy: session.user.discordId });
  return NextResponse.json({ warrant });
}
