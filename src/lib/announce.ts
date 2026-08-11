/**
 * Calls the bot's POST /internal/announce (BOT_SIDE_INSTRUCTIONS.md #4),
 * which speaks the message through the live voice dispatcher AND posts it
 * as in-game PA. Still non-blocking by design: callers (e.g. the 911 flow)
 * must never let a failure here (bot offline, env not configured) stop
 * their own DB write.
 */
export async function announceInGame(message: string): Promise<{ ok: boolean; reason?: string }> {
  const url = process.env.BOT_INTERNAL_API_URL;
  const secret = process.env.BOT_INTERNAL_API_SECRET;
  if (!url || !secret) {
    console.warn(
      "[announce] BOT_INTERNAL_API_URL/BOT_INTERNAL_API_SECRET not configured — bot endpoint unreachable, see BOT_SIDE_INSTRUCTIONS.md #4",
    );
    return { ok: false, reason: "not_configured" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      console.warn(`[announce] bot endpoint responded ${res.status} — see BOT_SIDE_INSTRUCTIONS.md #4`);
      return { ok: false, reason: `http_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.warn(
      "[announce] bot endpoint unreachable (not yet built) — see BOT_SIDE_INSTRUCTIONS.md #4",
      err,
    );
    return { ok: false, reason: "unreachable" };
  }
}
