import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { clearCall } from "@/db/queries/calls";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  await clearCall(id);
  return NextResponse.json({ ok: true });
}
