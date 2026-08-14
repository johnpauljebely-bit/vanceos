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

/**
 * Calls the bot's POST /internal/notify-unit (requested 2026-08-14, not yet
 * built — tracked in BOT_SIDE_INSTRUCTIONS.md) to PM a specific officer
 * in-game, for auto-dispatches reaching someone who doesn't have the CAD
 * tab open. Derives the URL from BOT_INTERNAL_API_URL's origin (same host
 * as /internal/announce, different path) rather than a second env var —
 * one tunnel URL to update when it changes, not two. Non-blocking and
 * silently no-ops today since the endpoint doesn't exist yet; every
 * dispatch path already has the browser alert as the primary notification.
 */
export async function notifyUnit(discordId: string, message: string): Promise<{ ok: boolean; reason?: string }> {
  const announceUrl = process.env.BOT_INTERNAL_API_URL;
  const secret = process.env.BOT_INTERNAL_API_SECRET;
  if (!announceUrl || !secret) return { ok: false, reason: "not_configured" };

  let url: string;
  try {
    url = new URL("/internal/notify-unit", announceUrl).toString();
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
      body: JSON.stringify({ discordId, message }),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true };
  } catch (err) {
    console.warn("[notifyUnit] bot endpoint unreachable (not yet built) — see BOT_SIDE_INSTRUCTIONS.md", err);
    return { ok: false, reason: "unreachable" };
  }
}
