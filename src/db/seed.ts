import "./loadEnv";
import { db } from "./index";
import { links, callsigns, liveUnits } from "./schema";

/**
 * Dev-only mock data. The CAD's local dev DB has no access to the bot's
 * real SQLite `links`/`callsigns` data (that only becomes possible once
 * BOT_SIDE_INSTRUCTIONS.md #1's Postgres migration lands and DATABASE_URL
 * points at the shared instance) — this seed is the documented interim so
 * the UI has real-looking data to render against locally.
 */
async function seed() {
  console.log("[seed] inserting mock links...");
  await db
    .insert(links)
    .values([
      {
        discordId: "111111111111111111",
        robloxUsername: "JPMorgan_RP",
        robloxUserId: "3312674261",
        verifiedAt: new Date().toISOString(),
      },
      {
        discordId: "222222222222222222",
        robloxUsername: "DeltaCitizen42",
        robloxUserId: "5589012347",
        verifiedAt: new Date().toISOString(),
      },
    ])
    .onConflictDoNothing();

  console.log("[seed] inserting mock callsigns...");
  await db
    .insert(callsigns)
    .values([
      {
        department: "rcmp",
        number: 1409,
        rank: "Constable",
        discordId: "111111111111111111",
        assignedAt: new Date().toISOString(),
        assignedBy: "999999999999999999",
      },
      {
        department: "delta-pd",
        number: 442,
        rank: "Officer",
        discordId: "222222222222222222",
        assignedAt: new Date().toISOString(),
        assignedBy: "222222222222222222",
      },
    ])
    .onConflictDoNothing();

  console.log("[seed] inserting mock live_units...");
  await db
    .insert(liveUnits)
    .values([
      {
        callsignKey: "rcmp-1409",
        department: "rcmp",
        number: 1409,
        discordId: "111111111111111111",
        robloxUsername: "JPMorgan_RP",
        rank: "Constable",
        onDuty: true,
        postal: "2171",
        location: "2171 Main Street - Postal 2171",
        agency: "PCSO",
        subdivision: "---",
      },
    ])
    .onConflictDoNothing();

  console.log("[seed] done");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
