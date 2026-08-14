import { NextResponse } from "next/server";
import { db } from "@/db";
import { links } from "@/db/schema";
import { livePlayers } from "@/db/botOwnedTables";
import { requireApiSession } from "@/lib/session";
import { listLiveUnits } from "@/db/queries/liveUnits";
import { listActiveCalls, listCallUnitAssignments } from "@/db/queries/calls";
import { worldToPct } from "@/lib/mapTransform";
import { postalToCoords } from "@/lib/postalCoords";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const [units, calls, assignments, allLinks, allLivePlayers] = await Promise.all([
    listLiveUnits(),
    listActiveCalls(),
    listCallUnitAssignments(),
    db.select().from(links),
    db.select().from(livePlayers),
  ]);

  const robloxByDiscordId = new Map(allLinks.map((l) => [l.discordId, l.robloxUsername]));
  const playerByUsername = new Map(allLivePlayers.map((p) => [p.robloxUsername.toLowerCase(), p]));

  const ONLINE_WINDOW_MS = 90_000;

  return NextResponse.json({
    units: units
      .filter((u) => u.onDuty)
      .map((u) => {
        // Prefer real live coordinates (always populated) over the `postal`
        // column (currently broken upstream — see COORDINATION.md) so units
        // still place correctly on the map even without it.
        const robloxUsername = u.discordId ? robloxByDiscordId.get(u.discordId) : undefined;
        const live = robloxUsername ? playerByUsername.get(robloxUsername.toLowerCase()) : undefined;
        // `onDuty` is bot-controlled and can go stale if it doesn't flip to
        // false promptly when someone leaves — a live_players match that's
        // no longer fresh means they're not actually online right now,
        // regardless of what onDuty still says.
        if (live && Date.now() - new Date(live.updatedAt).getTime() > ONLINE_WINDOW_MS) return null;
        const coords = live
          ? worldToPct(live.locationX ?? 0, live.locationZ ?? 0)
          : postalToCoords(u.postal);
        if (!coords) return null;
        return {
          callsignKey: u.callsignKey,
          department: u.department,
          number: u.number,
          rank: u.rank,
          status: u.status,
          postal: u.postal ?? live?.postal ?? null,
          robloxUsername: u.robloxUsername,
          coords,
        };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null),
    calls: calls
      .map((c) => {
        const coords = postalToCoords(c.postal);
        if (!coords) return null;
        return {
          id: c.id,
          title: c.title,
          type: c.type,
          status: c.status,
          postal: c.postal,
          primaryUnitCallsign: c.primaryUnitCallsign,
          units: assignments.get(c.id) ?? [],
          coords,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null),
  });
}
