import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { getRecord, updateRecord } from "@/db/queries/records";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).optional(),
  subjectName: z.string().max(100).optional(),
  details: z.record(z.string(), z.string()).optional(),
  status: z.enum(["draft", "final"]).optional(),
});

/** Promotes a draft to final, or re-saves its edited details — never creates a duplicate row. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const existing = await getRecord(Number(id));
  if (!existing || existing.createdBy !== session.user.discordId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const record = await updateRecord(Number(id), parsed.data);
  return NextResponse.json({ record });
}
