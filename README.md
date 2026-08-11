# Delta City CAD

Computer-aided dispatch website for the Delta City ER:LC roleplay community, replacing Melonly.
Next.js (App Router) frontend, Postgres via Drizzle ORM, Discord OAuth login.

Sibling project to the `delta-city-dispatch` Discord bot (`/Users/Test/delta-city-dispatch`),
which owns Discord↔Roblox linking, callsigns, and all direct ER:LC API access. This app reads
that bot's data and, where it needs something the bot doesn't expose yet, records a
copy-pasteable instruction in [`BOT_SIDE_INSTRUCTIONS.md`](./BOT_SIDE_INSTRUCTIONS.md) instead
of guessing at it. See [`COORDINATION.md`](./COORDINATION.md) for the running status log between
this repo's session and the bot repo's session.

## Getting started

As of 2026-08-10, `DATABASE_URL` in `.env.local` points at a real shared Postgres instance
(Homebrew `postgresql@16`, `brew services start postgresql@16`, database `delta_city`) that both
this app and the bot use — not the embedded PGlite fallback described below.

```bash
cp .env.example .env.local   # fill in Discord OAuth creds, NEXTAUTH_SECRET, DATABASE_URL
npm run db:generate          # generate SQL migrations from src/db/schema.ts
npm run db:migrate           # apply migrations to whatever DATABASE_URL points at
npm run db:seed              # seed mock links/callsigns/live_units (skip once real bot data exists)
npm run dev                  # http://localhost:3002
```

**If you don't have Postgres available** (no `DATABASE_URL` set), the DB falls back to an
embedded, zero-install PGlite instance stored at `./.pglite` — the schema and query code are
identical either way. PGlite is **not** safe for concurrent multi-process access to the same data
directory, though, and Next's Turbopack dev server runs multiple worker processes — a plain
`npm run dev` against PGlite will intermittently throw "relation does not exist" errors from
workers racing each other. Use `npm run dev:local-pglite` instead in that case — it starts a
single dedicated PGlite process (`src/db/pgliteServer.ts`, via `@electric-sql/pglite-socket`) that
all Next.js workers connect to safely over a local TCP socket, then waits for it to be ready
before starting `next dev`.

## Why some things are stubbed

The civilian 911 flow's in-game PA announcement depends on the bot's `POST /internal/announce`
(`BOT_SIDE_INSTRUCTIONS.md` #4) — check `COORDINATION.md` for whether that's live yet. Radio,
10-Codes/Tones configuration, and Dispatch AI are intentionally not built here at all — those
belong entirely to the bot's voice/dispatch pipeline.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, NextAuth v5 (Discord provider), Drizzle
ORM (`pg` against real Postgres, `@electric-sql/pglite` as a zero-install local fallback), Zod,
SWR.
