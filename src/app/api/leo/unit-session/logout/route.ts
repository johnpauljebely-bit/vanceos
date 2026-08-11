import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { clearUnitSession } from "@/lib/unitSession";

export async function POST() {
  const { error } = await requireApiSession();
  if (error) return error;

  await clearUnitSession();
  return NextResponse.json({ ok: true });
}
