function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptAnnounce(
  url: string,
  secret: string,
  message: string,
  spokenMessage: string | undefined,
): Promise<{ ok: boolean; reason?: string; retryable?: boolean }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
      body: JSON.stringify(spokenMessage ? { message, spokenMessage } : { message }),
    });
    if (!res.ok) {
      // 5xx (including edge/tunnel errors like a flaky quick-tunnel's 502s,
      // per COORDINATION.md) is worth one retry; 4xx (bad secret, etc.)
      // won't be fixed by retrying.
      return { ok: false, reason: `http_${res.status}`, retryable: res.status >= 500 };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[announce] bot endpoint request failed", err);
    return { ok: false, reason: "unreachable", retryable: true };
  }
}

/**
 * Calls the bot's POST /internal/announce (BOT_SIDE_INSTRUCTIONS.md #4),
 * which speaks the message through the live voice dispatcher AND posts it
 * as in-game PA. Still non-blocking by design: callers (e.g. the 911 flow)
 * must never let a failure here (bot offline, env not configured, a flaky
 * tunnel) stop their own DB write.
 *
 * One retry with a short backoff on transient failures — per
 * COORDINATION.md, the bot's current stopgap is a free Cloudflare "quick"
 * tunnel with no uptime guarantee, and observed 502s didn't repeat on an
 * immediate manual retry.
 *
 * `spokenMessage` is optional — when given, it's what the voice dispatcher
 * actually says (e.g. a plate spelled out in NATO phonetics), while
 * `message` stays the literal text shown/PA'd. Falls back to `message` for
 * speech if omitted.
 */
export async function announceInGame(
  message: string,
  spokenMessage?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const url = process.env.BOT_INTERNAL_API_URL;
  const secret = process.env.BOT_INTERNAL_API_SECRET;
  if (!url || !secret) {
    console.warn(
      "[announce] BOT_INTERNAL_API_URL/BOT_INTERNAL_API_SECRET not configured — bot endpoint unreachable, see BOT_SIDE_INSTRUCTIONS.md #4",
    );
    return { ok: false, reason: "not_configured" };
  }

  const first = await attemptAnnounce(url, secret, message, spokenMessage);
  if (first.ok || !first.retryable) return first;

  await sleep(400);
  const retry = await attemptAnnounce(url, secret, message, spokenMessage);
  if (!retry.ok) {
    console.warn(`[announce] bot endpoint failed after retry (${retry.reason}) — see BOT_SIDE_INSTRUCTIONS.md #4`);
  }
  return retry;
}
