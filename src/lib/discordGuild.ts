const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "1535866581316276256"; // src/config.ts GUILD_ID in delta-city-dispatch

/**
 * Fetches the caller's roles in the Delta City guild via the Discord OAuth
 * `guilds.members.read` scope. Returns null (not an empty array) on any
 * failure, so callers can distinguish "no roles" from "couldn't check" —
 * both must still fail closed (no access), never fail open.
 */
export async function fetchGuildRoles(accessToken: string): Promise<string[] | null> {
  try {
    const res = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const member = (await res.json()) as { roles?: string[] };
    return member.roles ?? [];
  } catch {
    return null;
  }
}
