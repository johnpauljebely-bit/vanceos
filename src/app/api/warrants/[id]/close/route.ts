import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { closeWarrant } from "@/db/queries/warrants";

/**
 * "Active warrants can now be closed directly from the warrant record
 * window ... Only active (open) warrants can be closed" — lets officers
 * close warrants during in-RP arrests without dispatcher/court involvement.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const result = await closeWarrant(Number(id));
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
