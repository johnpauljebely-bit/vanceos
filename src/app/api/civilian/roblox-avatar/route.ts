import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { getLinkForDiscordId } from "@/db/queries/civilians";

/** Roblox's thumbnail API is public — no key needed, just the linked roblox_user_id. */
export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const link = await getLinkForDiscordId(session.user.discordId);
  if (!link?.robloxUserId) {
    return NextResponse.json({ error: "not_linked" }, { status: 409 });
  }

  const res = await fetch(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${link.robloxUserId}&size=420x420&format=Png&isCircular=false`,
  );
  if (!res.ok) {
    return NextResponse.json({ error: "roblox_unreachable" }, { status: 502 });
  }
  const json = await res.json();
  const url = json?.data?.[0]?.imageUrl as string | undefined;
  if (!url) return NextResponse.json({ error: "no_thumbnail" }, { status: 404 });

  return NextResponse.json({ url });
}
