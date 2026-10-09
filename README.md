# Overs/Unders

A small NBA draft game for friends. 2, 3 or 5 players snake-draft all 30 teams, each pick tagged **Wins** or **Losses**, and score 1 point per tagged result over the 2026–27 regular season.

## Stack

- Next.js (App Router) on Vercel (Hobby)
- Neon Postgres + Drizzle ORM
- Tailwind CSS, 90s arcade theme
- Game data: balldontlie free tier

## Setup

1. Import this repo in Vercel.
2. In the Vercel project, attach a Neon Postgres database (Storage → Neon). This sets `DATABASE_URL`.
3. Add `BALLDONTLIE_API_KEY` as an environment variable.
4. Redeploy. The build runs migrations and seeds the 30 teams automatically.
5. Check `/api/health` returns `"ok": true`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server (needs `.env` with `DATABASE_URL`) |
| `npm run build` | Runs migrations + seed, then `next build` |
| `npm run db:generate` | Generate a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations + seed |
| `npm test` | Unit tests (Vitest) |
