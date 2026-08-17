import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { clearCall } from "@/db/queries/calls";
import { getUnitSession } from "@/lib/unitSession";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const unit = await getUnitSession();
  const clearedBy = unit ? `${unit.department.toUpperCase()} ${unit.number} — ${unit.rpName}` : undefined;
  await clearCall(id, clearedBy);
  return NextResponse.json({ ok: true });
}
