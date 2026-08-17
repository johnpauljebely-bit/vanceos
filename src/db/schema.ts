import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  primaryKey,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------
 * Mirrored bot tables — shape matches delta-city-dispatch's SQLite schema
 * exactly (src/db.ts in that repo), so a future Postgres cutover there is
 * rename-free. Read-only from the CAD's perspective: never written here.
 * ---------------------------------------------------------------------- */

export const links = pgTable("links", {
  discordId: text("discord_id").primaryKey(),
  robloxUsername: text("roblox_username").notNull().unique(),
  robloxUserId: text("roblox_user_id"),
  verifiedAt: text("verified_at").notNull(),
});

export const callsigns = pgTable(
  "callsigns",
  {
    department: text("department").notNull(),
    number: integer("number").notNull(),
    rank: text("rank").notNull(),
    discordId: text("discord_id").notNull(),
    assignedAt: text("assigned_at").notNull(),
    assignedBy: text("assigned_by").notNull().default(""),
    totalSeconds: integer("total_seconds").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.department, t.number] })],
);

/* -------------------------------------------------------------------------
 * Shared "calls" system of record — civilian 911 flow AND the LEO call-
 * intake form both write here. Extended vs. the bot's current minimal shape
 * per BOT_SIDE_INSTRUCTIONS.md #2.
 * ---------------------------------------------------------------------- */

export const calls = pgTable("calls", {
  id: text("id").primaryKey(),
  callNumber: serial("call_number").notNull(), // display as CAD-##### — format is our own inference, Melonly leaves it "configurable"
  title: text("title"),
  description: text("description"),
  team: text("team"),
  department: text("department"), // 'delta-pd' | 'rcmp' | 'bchp'
  status: text("status").notNull().default("new"), // new|dispatched|en_route|on_scene|cleared
  type: text("type"),
  origin: text("origin"),
  primaryUnitCallsign: text("primary_unit_callsign"),
  panels: text("panels").notNull().default("All"),
  code: text("code"),
  priority: text("priority"),
  postal: text("postal"),
  address: text("address"),
  source: text("source").notNull(), // 'caller' | 'leo' | 'erlc_native'
  civilianDiscordId: text("civilian_discord_id"),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
  clearedAt: text("cleared_at"),
  clearedBy: text("cleared_by"),
  // Proxy severity signal for ER:LC-native calls (e.g. robberies) — the
  // bot correlates the reporting/nearest player's live wanted_stars at
  // call-creation time, per COORDINATION.md. Null for CAD-originated calls
  // (911/311/traffic stop/panic), which have no such signal.
  wantedStars: integer("wanted_stars"),
});

export const callUnits = pgTable(
  "call_units",
  {
    callId: text("call_id").notNull(),
    discordId: text("discord_id").notNull(),
    assignedAt: text("assigned_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.callId, t.discordId] })],
);

export const callNotes = pgTable("call_notes", {
  id: serial("id").primaryKey(),
  callId: text("call_id").notNull(),
  noteType: text("note_type").notNull().default("Text"),
  noteText: text("note_text").notNull(),
  authorDiscordId: text("author_discord_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* -------------------------------------------------------------------------
 * Net-new, CAD-owned tables — no bot-side dependency.
 * ---------------------------------------------------------------------- */

export const citations = pgTable("citations", {
  id: serial("id").primaryKey(),
  civilianDiscordId: text("civilian_discord_id").notNull(),
  officerDiscordId: text("officer_discord_id").notNull(),
  offense: text("offense").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"), // 'unpaid' | 'paid'
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const civilianProfiles = pgTable("civilian_profiles", {
  discordId: text("discord_id").primaryKey(),
  alias: text("alias").notNull(), // = linked roblox_username, LOCKED
  birthday: text("birthday").notNull(), // MM-DD, derived from Roblox `created`, year-10. LOCKED.
  gender: text("gender"), // chosen at setup; editable after
  rpName: text("rp_name").notNull(), // randomly generated at creation; editable after
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("500.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Melonly-style characters: a civilian can create multiple, each with its
 * own name/DOB/sex/address/phone — distinct from `civilian_profiles`, which
 * stays the single locked auto-generated identity tied to the Roblox link
 * (per the original brief). The auto-generated identity gets mirrored into
 * one default character on first access so vehicles/licences always have
 * something to attach to.
 */
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  civilianDiscordId: text("civilian_discord_id").notNull(),
  firstName: text("first_name").notNull(),
  middleInitial: text("middle_initial"),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  sex: text("sex"), // 'Male' | 'Female'
  address: text("address"),
  phoneNumber: text("phone_number"),
  linkedRobloxUsername: text("linked_roblox_username"), // optional, per Melonly spec — doubles as "Alias," LOCKED once set from the link
  skinColour: text("skin_colour"),
  hairColour: text("hair_colour"),
  eyeColour: text("eye_colour"),
  height: text("height"),
  weight: text("weight"),
  ssn: text("ssn"), // cosmetic in-RP identifier, auto-generated — not a real SSN
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull(),
  plate: text("plate").notNull().unique(),
  make: text("make"),
  model: text("model"),
  colour: text("colour"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const licences = pgTable("licences", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull(),
  type: text("type").notNull().default("Driver"),
  status: text("status").notNull().default("pending"), // pending|approved|denied|suspended
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Closable directly by LEO from the record window, per the brief. */
export const warrants = pgTable("warrants", {
  id: serial("id").primaryKey(),
  subjectName: text("subject_name").notNull(),
  charges: text("charges").notNull(),
  signature: text("signature"),
  status: text("status").notNull().default("active"), // active|closed
  issuedBy: text("issued_by").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const bolos = pgTable("bolos", {
  id: serial("id").primaryKey(),
  subjectName: text("subject_name"),
  description: text("description").notNull(),
  type: text("type").notNull().default("general"), // 'arrest' | 'general'
  status: text("status").notNull().default("active"),
  issuedBy: text("issued_by").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

/** Generalized records/reports — one table, many record_type values, matching Melonly's customizable-templates idea without inventing per-type tables. */
export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  recordType: text("record_type").notNull(), // vehicle_citation|general_citation|arrest_report|accident_report
  title: text("title").notNull(),
  content: text("content").notNull(),
  subjectName: text("subject_name"),
  // Structured per-type fields (driver/vehicle details) — kept schema-less
  // since Melonly's own docs describe records as "fully customisable
  // templates," and a jsonb blob avoids a rigid column per field per type.
  details: jsonb("details").$type<Record<string, string>>(),
  status: text("status").notNull().default("final"), // 'draft' | 'final'
  createdBy: text("created_by").notNull(),
  department: text("department"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Interim + target shape for the Active Units panel. Today: seeded with mock
 * rows for local dev, and upserted by a unit's own "Available" duty toggle.
 * Once BOT_SIDE_INSTRUCTIONS.md #3 ships, the bot's poller upserts every
 * unit's row here directly — the CAD's read path never changes.
 */
export const liveUnits = pgTable("live_units", {
  callsignKey: text("callsign_key").primaryKey(), // `${department}-${number}`
  department: text("department").notNull(),
  number: integer("number").notNull(),
  discordId: text("discord_id"),
  robloxUsername: text("roblox_username"),
  rank: text("rank"),
  onDuty: boolean("on_duty").notNull().default(false), // bot-controlled: actually logged in with a matching in-game callsign
  status: text("status").notNull().default("available"), // CAD-controlled: available|unavailable|busy|enroute|on_scene
  callId: text("call_id"),
  postal: text("postal"),
  location: text("location"),
  agency: text("agency"),
  subdivision: text("subdivision"),
  items: text("items"), // Melonly's "Items / Abilities" — free text for now
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Real but unpopulated today — no squad-creation flow is specified anywhere
 * in the brief, so Active Squads always renders the spec'd "No Data" empty
 * state. The schema exists so that state is genuine, not faked.
 */
export const squads = pgTable("squads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  status: text("status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const squadUnits = pgTable(
  "squad_units",
  {
    squadId: integer("squad_id").notNull(),
    callsignKey: text("callsign_key").notNull(),
  },
  (t) => [primaryKey({ columns: [t.squadId, t.callsignKey] })],
);

/**
 * Self Dispatch is gated behind a request/approval flow, not a free
 * toggle: the requester asks a qualifying online HR (ownership 100-199, or
 * rcmp/bchp 1000-1199/2000-2199), that HR gets a popup to accept/deny, and
 * only on accept does the requester's session actually get self-dispatch
 * rights. One row per request; both sides poll this table for their side
 * of the exchange (no WebSocket infra exists yet — see useLiveQuery).
 */
/**
 * Reusable LEO "unit" identities a player can pick between at unit-select
 * instead of retyping RP Name/Agency/Subdivision/Items every shift — up to
 * 3 per (discordId, department), enforced in the query layer. Independent
 * of which callsign number they currently hold; Delta PD only ever uses
 * `rpName` here since its callsign is always live-derived, never typed.
 */
export const unitProfiles = pgTable("unit_profiles", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull(),
  department: text("department").notNull(),
  rpName: text("rp_name").notNull(),
  agency: text("agency"),
  subdivision: text("subdivision"),
  items: text("items"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const selfDispatchRequests = pgTable("self_dispatch_requests", {
  id: serial("id").primaryKey(),
  requesterDiscordId: text("requester_discord_id").notNull(),
  requesterCallsignKey: text("requester_callsign_key").notNull(),
  approverDiscordId: text("approver_discord_id").notNull(),
  approverCallsignKey: text("approver_callsign_key").notNull(),
  status: text("status").notNull().default("pending"), // pending|approved|denied
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});
