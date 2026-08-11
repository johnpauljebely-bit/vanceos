import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "./auth";

/**
 * A session cookie minted before the account.providerAccountId fix (or any
 * future auth regression) can exist and decode successfully while carrying
 * an empty discordId — that must never reach a DB query (PGlite/Postgres
 * error on an empty-string bound param, not a clean "no rows" result).
 * Route straight to the stale-session recovery UI instead.
 */
export async function requireDiscordSession() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!session.user.discordId) redirect("/login?error=stale_session");
  return session;
}

/**
 * Route Handler equivalent of requireDiscordSession — same "never let an
 * empty discordId reach a DB query" guarantee, but returns a 401 instead of
 * redirecting (there's no page to redirect an API caller to).
 */
export async function requireApiSession(): Promise<
  { session: Session; error: null } | { session: null; error: NextResponse }
> {
  const session = await auth();
  if (!session || !session.user.discordId) {
    return {
      session: null,
      error: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
