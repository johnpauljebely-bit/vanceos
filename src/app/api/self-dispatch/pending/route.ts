import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getPendingRequestForApprover } from "@/db/queries/selfDispatch";

/** Polled by every CAD session — is there a Self Dispatch request waiting on ME to approve? */
export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const request = await getPendingRequestForApprover(session.user.discordId);
  return NextResponse.json({ request });
}
