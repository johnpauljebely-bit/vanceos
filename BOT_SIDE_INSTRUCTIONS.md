# BOT_SIDE_INSTRUCTIONS.md

Instructions for changes needed in the sibling repo `/Users/Test/delta-city-dispatch` (the
Discord bot), generated while building the Delta City CAD website at
`/Users/Test/delta-city-cad`. That repo is off-limits to the CAD build — nothing here has been
applied there. Each entry below is meant to be pasted as the opening prompt to a **separate**
Claude Code session with `/Users/Test/delta-city-dispatch` as its working directory.

Entries are appended, never rewritten, as more gaps surface. Check back here after each session
that reports "added a BOT_SIDE_INSTRUCTIONS entry."

---

## 2026-08-10 — #1: Migrate storage from SQLite to shared Postgres

In `/Users/Test/delta-city-dispatch`, replace the `node:sqlite` `DatabaseSync` in `src/db.ts`
with a Postgres client (recommend `pg` + hand-written SQL, or `drizzle-orm`'s `node-postgres`
driver if you want type safety — match whatever the CAD side ends up using at
`/Users/Test/delta-city-cad/src/db/schema.ts` for the overlapping tables so both processes point
at literally the same schema). Read the connection string from a new `DATABASE_URL` env var
(add to `.env.example`). Preserve every existing table shape exactly (`links`, `verify_codes`,
`callsigns`, `calls`, `call_units`, `traffic_stops`, `traffic_stop_units`) — this is a storage
swap, not a schema redesign. Write a one-time migration script that reads all rows out of the
existing `dispatch.db` SQLite file and inserts them into the new Postgres tables, run once
manually before cutover. Keep all existing exported functions in `src/db.ts` with identical
signatures so no caller elsewhere in the bot needs to change.

## 2026-08-10 — #2: Extend `calls` with CAD-required columns, add `call_notes`

The CAD website's Active Call form needs richer fields than `calls` currently has. Add these
nullable/defaulted columns to `calls` (via an additive migration, not a breaking rename):
`title TEXT`, `status TEXT NOT NULL DEFAULT 'new'` (values: new, dispatched, en_route, on_scene,
cleared), `type TEXT`, `origin TEXT`, `department TEXT`, `primary_unit_callsign TEXT`,
`panels TEXT NOT NULL DEFAULT 'All'`, `code TEXT`, `priority TEXT`, `address TEXT`,
`source TEXT NOT NULL DEFAULT 'erlc_native'` (values: caller, leo, erlc_native),
`civilian_discord_id TEXT`, `created_by TEXT`. Keep existing columns (`description`, `team`,
`postal`, `created_at`, `cleared_at`) unchanged — the bot's own `recordNewCall`/`markCallCleared`
callers keep working (`source` defaults to `erlc_native` for calls the bot itself creates from
ER:LC's EmergencyCalls feed). Add a new table `call_notes (id SERIAL PRIMARY KEY, call_id TEXT
NOT NULL, note_type TEXT NOT NULL DEFAULT 'Text', note_text TEXT NOT NULL, author_discord_id
TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())` for an append-only notes log per
call. No existing bot code needs to write to `call_notes` — it's populated by the CAD website
only, but must live in the same Postgres database. Depends on #1 (Postgres migration) landing
first.

## 2026-08-10 — #3: Add a `live_units` cache table, upserted by the existing duty poller

The CAD's "Active Units" board needs live on-duty/position data, but today that only exists
transiently inside three independent poll loops (`callDispatch.ts` every 15s,
`callsignDutyTracker.ts` every 60s, `complianceMonitor.ts` every 30s), none of which persist
current state anywhere. Add ONE new table, `live_units (callsign_key TEXT PRIMARY KEY, department
TEXT NOT NULL, number INTEGER NOT NULL, discord_id TEXT, roblox_username TEXT, rank TEXT,
on_duty BOOLEAN NOT NULL DEFAULT false, call_id TEXT, postal TEXT, location TEXT, agency TEXT,
subdivision TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())` where `callsign_key` is
`{department}-{number}`. DO NOT add a fourth poller. Instead, extend the existing
`callsignDutyTracker.ts` 60s loop (it already calls `getServerPlayers()` and already iterates
every assigned callsign) to also upsert one `live_units` row per callsign it finds live in
ER:LC on that same pass: set `on_duty = true`, `postal`/`location` from the player's
`PostalCode`/`Location`, `roblox_username` from the matched player. For callsigns it does NOT
find live in that pass, upsert `on_duty = false` (still update `updated_at` so the CAD can tell
freshness apart from silence). This is a consolidation of what the poller already computes, not
new ER:LC API surface. Depends on #1.

## 2026-08-10 — #4: Add `POST /internal/announce`, an authenticated wrapper around `announcePA()`

The CAD website's civilian 911 quick-form needs to trigger an in-game PA announcement, but the
CAD has no ER:LC server key of its own and per the project brief the bot owns the ER:LC
integration exclusively. Add a new Express route in `/Users/Test/delta-city-dispatch/src/index.ts`
(or a new `src/internalApi.ts` mounted from there): `POST /internal/announce`, protected by a
shared-secret header (e.g. `X-Internal-Secret`, compared against a new `INTERNAL_API_SECRET`
env var — add to `.env.example`, generate a random value, and put the SAME value in the CAD's
`.env.local` as `BOT_INTERNAL_API_SECRET`). Body: `{ "message": string }`. On a valid request,
call the existing `announcePA(message)` from `src/erlcClient.ts` (no changes needed to
`erlcClient.ts` itself) and respond `{ ok: true }` on success or an appropriate error status on
failure (e.g. 401 for bad secret, 502 if `announcePA` returns false). Reject requests missing or
mismatching the secret header with 401 before doing anything else. No other bot behavior changes.

## 2026-08-10 — #5: Delta PD's `/callsign` self-assign gap — CAD is temporarily self-registering

Per `src/config.ts`, `DELTA_PD_CALLSIGN_RANGE` (400-499) exists but `/callsign` has no code path
that actually lets a Delta PD officer self-assign into it — confirmed via source read. Since the
brief requires Delta PD callsigns to be self-chosen (unlike rcmp/bchp's `/callsign`-assigned
flow), the CAD website is, as of today, writing directly into the shared `callsigns` table itself
when a Delta PD officer picks a number in the CAD's unit-select screen (range + uniqueness
checked CAD-side: `department='delta-pd', number, rank='Officer', discord_id, assigned_at,
assigned_by=<self>`). This is a stand-in, not a permanent design — when you do implement Delta
PD self-assign on the bot side (e.g. a `;callsign <number>` in-game command or a `/callsign
self-assign` Discord command), it MUST write to the exact same `callsigns` table shape/columns
so the two sides don't diverge into separate sources of truth for who holds which Delta PD
number. Also worth deciding together: once the bot owns this, should the CAD's self-registration
path be removed, or kept as a fallback? Flagging rather than deciding unilaterally, since it
affects both sides.

**Update 2026-08-11**: this landed — `/callsign self-assign` now writes to `callsigns` with the
same shape, and per your note in `COORDINATION.md` the CAD's self-registration path stays as a
fallback. No action needed, just closing the loop here too.

## 2026-08-11 — #6: Delta PD onboarding should validate against the officer's actual live in-game callsign

User's ask: "if it's possible delta police callsigns should be based on their ingame callsign" —
i.e. instead of (or in addition to) letting a Delta PD officer free-type any number 400-499 at
CAD onboarding (today's flow, range + uniqueness checked against `callsigns` only), the CAD
should be able to check what `Callsign` field ER:LC is currently reporting for that player and
validate/prefill against it.

The CAD has no way to do this itself — no ER:LC server key, by design (you own that integration
exclusively). The blocker specifically: at the moment someone is onboarding into Delta PD, they
have no `callsigns` row yet (that's what onboarding creates), so `live_units` (keyed by
`callsign_key = department-number`) has nothing to look up either — it's a chicken-and-egg gap,
not something solvable by querying tables that already exist.

What would unblock this: some way for the CAD to ask "what is `<roblox_username>`'s current
live in-game `Callsign` field right now, if they're connected to the server" — independent of
whether a `callsigns` row exists yet. A few shapes that would work, your call on which fits best:
- A small cache table (e.g. `live_players: roblox_username, callsign, team, updated_at`) your
  existing `getServerPlayers()` poll loop upserts every pass, that the CAD can read directly —
  same pattern as `live_units`, just not gated on a pre-existing callsign assignment.
- Or a lightweight authenticated endpoint (like `/internal/announce`, but a GET returning the
  live `Callsign` for a given Roblox username/ID) if you'd rather not add another cache table.

Not urgent — the current self-entry-with-range/uniqueness-validation flow still works and isn't
broken, this would just make it more accurate (catch a mismatch between what someone types in the
CAD and what they've actually set in-game). Flagging the idea, not requesting a specific
implementation — genuinely your call on the shape given you know the poller's constraints better
than I do.

**Update 2026-08-11**: done, via `live_players` (see #7). CAD-side wired up: `GET
/api/leo/live-callsign` looks up the linked Roblox username's row and returns it if `updated_at`
is within the last 90s; Delta PD onboarding prefills the callsign field with it and shows a
match/mismatch/offline hint. Verified end-to-end against the real shared table.

## 2026-08-11 — #7: Broader live ER:LC data mirror, not just the narrow `live_units` subset

User's ask: expose more of what ER:LC's API already gives you, so the CAD can build things like a
real Map page (still a stub today) and richer Active Units data, without needing a bespoke new
cache table + BOT_SIDE_INSTRUCTIONS entry every time a new feature needs one more field.

Concretely, today `live_units` only has a row per *assigned callsign*, and only the fields the
duty tracker happened to need (`on_duty`, `postal`, `location` as a string, `roblox_username`).
It doesn't cover: players who aren't matched to an assigned callsign at all (e.g. civilians,
unlinked players), raw `LocationX`/`LocationZ` as separate numeric fields (useful for an actual
map pin or distance math — see the location-format question you already answered, that answer
stands for `live_units` specifically, this is a different, broader ask), `WantedStars`, vehicles,
or the raw `EmergencyCalls` feed beyond what `callDispatch.ts` already writes into `calls`.

What would help: a general live-state mirror — could be as simple as one more cache table (e.g.
`live_players: roblox_username, roblox_user_id, team, callsign, postal, location_x, location_z,
wanted_stars, updated_at`, upserted every `getServerPlayers()` poll pass for **every** player, not
just ones with an assigned callsign) that the CAD can read freely for whatever it needs next,
rather than me coming back with narrow asks one at a time. If vehicle data becomes available via
the ER:LC API too, same idea would apply there.

Same caveat as always: this is a consolidation of data your poller already fetches, not a request
for a new poller or new ER:LC API surface. No specific feature is blocked on this today — the Map
page is still an unbuilt stub — so no urgency, just getting the ask on record since the user
raised it.

**Update 2026-08-11**: done — `live_players` table shipped, shape confirmed and verified against
the real shared DB (`\d live_players` matches exactly what you posted in `COORDINATION.md`). Added
a read-only mirror on my side at `src/db/botOwnedTables.ts` (deliberately kept outside my tracked
`schema.ts`/`drizzle.config.ts` so my migrations never try to "recreate" a table you own — same
pattern as the rest of the mirrored tables, just isolated so there's no DDL collision risk).
Currently used for #6 (Delta PD onboarding). Map page still unbuilt — will use the rest of this
table (location_x/z, team, wanted_stars) whenever that gets built.

## 2026-08-11 — #8: Start Phase 3 — the voice radio dispatcher (user's explicit ask, priority)

Correction to what I said in `COORDINATION.md` about Panic/Traffic Stop "broadcasting" — I was
wrong about what the user meant. They want real **voice** announcements in the dispatch radio
channel, not the in-game ER:LC PA text (`:h` messages via `announcePA`) I built for 911/Panic/
Traffic Stop. That means the actual gap is your Phase 3 (voice dispatcher) not existing yet at
all — not the ER:LC IP-allowlist 403, which is a real but separate/smaller issue. User explicitly
asked me to start this now, overriding their earlier "defer voice/Dispatch AI until later."

Pulling the full spec from the original project brief so you have it in one place, since this is
a big build and I don't want you working from a summary:

**Stack** (all free/self-hosted, no billed APIs): STT = **Vosk** (offline, CPU, no key) — whisper.cpp
as fallback if accuracy is too rough. TTS = **Piper** (free, built for Home Assistant-style local
voice) — eSpeak-ng as the lighter fallback. **No LLM** — a rules engine only: every recognized
phrase (status update, 10-code request, plate/BOLO check) maps to a canned response template;
unrecognized input triggers "say again," never a guess. This keeps the whole pipeline $0.

**Radio protocol** (half-duplex, one active speaker at a time — mirrors real radio discipline):
1. **Call-in**: unit keys up with callsign first, e.g. "1409 to dispatch." Dispatch ignores
   anything said before this handshake.
2. **Go-ahead**: dispatch responds "1409, go ahead," now treats 1409 as the sole active speaker.
3. **Message**: 1409 transmits.
4. **Acknowledge or clarify**: understood → "10-4, I understand," then acts or asks a natural
   follow-up; not understood → asks to repeat, never guesses.
5. **Queueing**: if another unit (e.g. 1378) keys up mid-exchange, dispatch says "1378, please
   hold" and queues them FIFO, working through the queue once the active exchange resolves.

Implementation-wise this is a simple state machine per dispatch session: an `activeSpeaker` slot
+ FIFO hold queue, gating what the STT→response pipeline acts on vs. queues vs. asks to repeat.

**Build location**: same Oracle VM as everything else, genuinely 24/7, using `@discordjs/voice`
(already a dependency) for audio capture/playback in the dispatch VC.

**How this should plug into what the CAD already calls**: the CAD's 911/Panic/Traffic Stop flows
already call your `POST /internal/announce` (shared-secret, `{ message: string }`) — built for
BOT_SIDE_INSTRUCTIONS.md #4. **Recommendation, not a demand**: once Phase 3 exists, have that same
endpoint's implementation also (or instead) push the message through Piper TTS into the dispatch
VC, rather than requiring the CAD to call a second, separate endpoint. If you'd rather keep in-game
PA and voice radio as genuinely separate concerns (e.g. some messages should go to both, some only
to voice), tell me and I'll adjust — specifically: should Panic/Traffic Stop/911 announcements go
to voice only, ER:LC PA only, or both? My current guess, not committing you to it: voice for
Panic/Traffic Stop (that's what the user actually asked for), keep ER:LC PA for 911 (matches the
brief's explicit "in-game announcement... and later Phase 3's voice dispatcher" phrasing for that
one specifically).

This is a large, multi-session build ("hardest part to build; build last," per the brief itself) —
not expecting this fast. Report progress in `COORDINATION.md` as you go rather than all at once,
same as everything else.

## 2026-08-11 — #9: Voice dispatcher needs to actually act on two concrete scenarios, and handle phrasing variability

User's exact ask, verbatim, since this is a spec not a paraphrase:

> add like when a user speaks to dispatch like "1500 to dispatch show me enroute to the call at
> postal [postal]" then dispatch does that and attaches that unit to that call and changes their
> status to enroute or "1500 to dispatch show me 10-8" and dispatch would say like "10-4 i
> undertsnad 1500" and change their status to avalible and yeah voice dispatcher needs to be a lot
> smarter give it like scenerios and what to do and yeah also not every request is gonna be worded
> the same so itl need to adapt

Two concrete scenarios, both need real side effects, not just a spoken ack:

1. **"[unit] to dispatch, show me en route to the call at postal [X]"** → find the open call whose
   `calls.postal = X` (shared `calls` table), write a `call_units` row linking that unit's
   `discord_id` to `calls.id`, and set that unit's `live_units.status = 'enroute'`. Then a spoken +
   queued-text ack, e.g. "10-4, 1500 en route to postal [X]." If no open call exists at that postal,
   say so instead of silently failing ("I don't have a call at postal [X], 1500" or similar — your
   call on exact wording).
2. **"[unit] to dispatch, show me 10-8"** → set `live_units.status = 'available'`, ack "10-4, I
   understand, 1500" (or similar phrasing — the user's exact example had a typo, "undertsnad," not
   asking you to reproduce the typo, just the ack pattern: confirm understanding, restate the unit
   number).

Both of these read/write tables the CAD already owns and you already share (`calls`, `call_units`,
`live_units`) — no new CAD-side table or endpoint needed for this, you already have direct DB
access. `live_units.status` is CAD-controlled text, one of
`available|unavailable|busy|enroute|on_scene` — exact match those values.

**The harder part, and the actual point of this request**: the user is explicit that phrasing
won't be consistent — "1500 to dispatch show me enroute to the call at postal 2171," "1500 show me
en route to postal 2171," "dispatch, 1500's en route to that call at 2171," etc. should all resolve
to the same intent. Given the zero-LLM rules-engine design from #8, flagging a real tension rather
than quietly picking one side of it: rigid phrase templates will miss real variation, but the
project's stated design (no LLM, $0 pipeline) pushes toward templates/keyword-slot-matching, not
open-ended NLU. However you resolve that tradeoff (broader keyword/slot matching with more
synonyms and word-order tolerance, a small local intent-classifier model, or something else) is
your call — just don't quietly narrow it to only the exact example phrasings above, since the user
explicitly said not to assume fixed wording. If you want confirmation before picking an approach
that's a bigger lift than expected (e.g. adding a local classifier model), post here first rather
than guessing silently.

This extends the existing `radioIntents.ts` rules engine (status updates + attach-to-call already
exist per your last update) rather than replacing it — sounds like postal-based call attachment
specifically (vs. by description/case number) may be the net-new piece, but you have the actual
code in front of you to confirm.
