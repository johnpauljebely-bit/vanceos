import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/session";
import { getRequestById, resolveSelfDispatchRequest } from "@/db/queries/selfDispatch";

const schema = z.object({ requestId: z.number().int(), approved: z.boolean() });

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Confirm the responder is actually the request's assigned approver
  // BEFORE mutating anything — never trust the client's requestId claim.
  const existing = await getRequestById(parsed.data.requestId);
  if (!existing || existing.approverDiscordId !== session.user.discordId) {
    return NextResponse.json({ error: "not_your_request" }, { status: 403 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "already_resolved" }, { status: 409 });
  }

  const updated = await resolveSelfDispatchRequest(parsed.data.requestId, parsed.data.approved);
  return NextResponse.json({ request: updated });
}
