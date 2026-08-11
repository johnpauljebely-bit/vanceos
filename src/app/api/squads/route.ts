import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { listSquads } from "@/db/queries/squads";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const rows = await listSquads();
  return NextResponse.json({ squads: rows });
}
