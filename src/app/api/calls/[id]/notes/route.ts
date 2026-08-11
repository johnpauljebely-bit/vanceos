import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { appendCallNote, listCallNotes } from "@/db/queries/calls";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const notes = await listCallNotes(id);
  return NextResponse.json({ notes });
}

const noteSchema = z.object({
  noteType: z.string().min(1).max(40),
  noteText: z.string().min(1).max(1000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const parsed = noteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const note = await appendCallNote({
    callId: id,
    noteType: parsed.data.noteType,
    noteText: parsed.data.noteText,
    authorDiscordId: session.user.discordId,
  });
  return NextResponse.json({ note });
}
