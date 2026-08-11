import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getLatestRequestForRequester } from "@/db/queries/selfDispatch";

/** Polled by the requester — has my Self Dispatch request been resolved yet? */
export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const request = await getLatestRequestForRequester(session.user.discordId);
  return NextResponse.json({ request });
}
