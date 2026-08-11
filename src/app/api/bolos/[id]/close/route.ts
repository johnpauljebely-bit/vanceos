import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { closeBolo } from "@/db/queries/warrants";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  await closeBolo(Number(id));
  return NextResponse.json({ ok: true });
}
