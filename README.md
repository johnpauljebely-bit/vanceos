# VanceOS — Computer Managed Dispatch (CMD)

Computer-aided dispatch website for the Delta City ER:LC roleplay community, replacing Melonly.
Next.js (App Router) frontend, Postgres via Drizzle ORM, Discord OAuth login, a live 2D map, and
voice-dispatch integration via a sibling Discord bot.

Sibling project to the `delta-city-dispatch` Discord bot (`/Users/Test/delta-city-dispatch`),
which owns Discord↔Roblox linking, callsigns, ER:LC API access, and the voice dispatcher. This
app reads that bot's data and, where it needs something the bot doesn't expose yet, records a
copy-pasteable instruction in [`BOT_SIDE_INSTRUCTIONS.md`](./BOT_SIDE_INSTRUCTIONS.md) instead
of guessing at it. See [`COORDINATION.md`](./COORDINATION.md) for the running status log between
this repo's session and the bot repo's session.

## Local development

```bash
cp .env.example .env.local   # fill in Discord OAuth creds, NEXTAUTH_SECRET, DATABASE_URL
npm install
npm run db:generate          # generate SQL migrations from src/db/schema.ts
npm run db:migrate           # apply migrations to whatever DATABASE_URL points at
npm run dev                  # http://localhost:3002
```

`DATABASE_URL` points at a real Postgres instance shared with the bot (locally: Homebrew
`postgresql@16`, database `delta_city`). **If you don't have Postgres available** (no
`DATABASE_URL` set), the DB falls back to an embedded, zero-install PGlite instance stored at
`./.pglite` — same schema/query code either way. PGlite isn't safe for the concurrent
multi-process access Turbopack's dev server does, though — use `npm run dev:local-pglite`
instead of plain `npm run dev` in that case.

## Deploying to Vercel

The app itself is a standard Next.js App Router project — `next build` succeeds cleanly and
Vercel auto-detects everything, no `vercel.json` needed. Two things need to be true before a
deploy actually **works**, though, not just builds:

1. **`DATABASE_URL` must point at a publicly reachable Postgres**, not the local
   `postgres://delta_city_app@localhost:5432/delta_city` used in dev — Vercel's serverless
   functions can't reach a database on a dev machine's `localhost`. Point it at a real hosted
   Postgres (Neon, Supabase, Railway, RDS, etc.) with `sslmode=require` if the provider needs it,
   and apply migrations (`npm run db:migrate` with that `DATABASE_URL`) before first use. This
   also becomes the bot's `DATABASE_URL` — they share one database.
2. **The Discord OAuth app's redirect URI** must include the production domain:
   `https://<your-vercel-domain>/api/auth/callback/discord`, added in the Discord Developer
   Portal for this app (same app the bot links to for `/link` verification).

Environment variables to set in the Vercel project (Settings → Environment Variables — see
`.env.example` for the full list with descriptions):

- `DATABASE_URL` — the hosted Postgres connection string above.
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` — same Discord application as the bot.
- `NEXTAUTH_SECRET` — a random secret (`openssl rand -base64 32`); NextAuth v5 also accepts
  `AUTH_SECRET`.
- `BOT_INTERNAL_API_URL`, `BOT_INTERNAL_API_SECRET` — the bot's public `/internal/announce`
  endpoint and shared secret, for 911/Panic/Traffic Stop announcements. Must be reachable from
  Vercel's network, so the bot needs a public URL too (not `localhost:3000`).

`NEXTAUTH_URL` doesn't need to be set explicitly on Vercel — Auth.js v5 trusts the request host
automatically when it detects the `VERCEL` environment (set automatically by the platform).

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, NextAuth v5 (Discord provider), Drizzle
ORM (`pg` against real Postgres, `@electric-sql/pglite` as a zero-install local fallback), Zod,
SWR.
