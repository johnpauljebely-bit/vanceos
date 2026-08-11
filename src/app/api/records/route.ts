import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { listRecordsByCreator, listAllRecords, listDraftsForCreator, createRecord } from "@/db/queries/records";

export async function GET(request: NextRequest) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const mine = request.nextUrl.searchParams.get("mine") === "1";
  const draftsOnly = request.nextUrl.searchParams.get("drafts") === "1";

  const rows = draftsOnly
    ? await listDraftsForCreator(session.user.discordId)
    : mine
      ? await listRecordsByCreator(session.user.discordId)
      : await listAllRecords();
  return NextResponse.json({ records: rows });
}

const recordSchema = z.object({
  recordType: z.enum(["vehicle_citation", "general_citation", "arrest_report", "accident_report"]),
  title: z.string().min(1).max(200),
  content: z.string().max(5000).default(""),
  subjectName: z.string().max(100).optional(),
  details: z.record(z.string(), z.string()).optional(),
  status: z.enum(["draft", "final"]).default("final"),
  department: z.string().optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = recordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const record = await createRecord({ ...parsed.data, createdBy: session.user.discordId });
  return NextResponse.json({ record });
}
