# GC Cup – Golf Tournament Web App

A Next.js web app for participants in a weekend golf tournament. Track team scores (Team Chubbs vs Team McAvoy), live match scores, and enter hole-by-hole scores per match.

## Stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **Supabase** (Postgres)
- **Vercel** (hosting)

No user authentication; admin is protected by a shared PIN.

## Setup

### 1. Clone and install

```bash
cd gc_cup
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/20240306000001_teams_players_sessions.sql`
   - `supabase/migrations/20240306000002_matches_hole_scores.sql`
   - `supabase/migrations/20240306000003_stableford_config.sql`
3. Run the seed to create the two teams:
   - `supabase/seed.sql`

### 3. Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – your Supabase anon/public key
- `ADMIN_PIN` – PIN required to access the admin area (e.g. `1234`)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the leaderboard and [http://localhost:3000/admin](http://localhost:3000/admin) for admin (enter PIN).

## Deploy on Vercel

1. Push the repo to GitHub and import the project in Vercel.
2. Add the same env vars in the Vercel project: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PIN`.
3. Deploy.

## Custom Stableford scoring

Stableford points are stored in the `stableford_config` table: `strokes_over_par` (e.g. +2, +1, 0, -1, -2) and `points`. The app uses these to convert gross score per hole into points (using a default par per hole). To use your own scoring:

1. In Supabase SQL Editor, update or insert rows in `stableford_config`, for example:

```sql
-- Example: par = 2, bogey = 1, double+ = 0, birdie = 3, eagle = 4
UPDATE stableford_config SET points = 0 WHERE strokes_over_par = 2;
UPDATE stableford_config SET points = 1 WHERE strokes_over_par = 1;
-- etc.
```

2. Default par by hole is in `lib/stableford.ts` (`DEFAULT_PAR_BY_HOLE`). Adjust that array if your course has different pars.

## Features

- **Leaderboard** – Team Chubbs vs Team McAvoy total points (from sessions that count); live in-progress matches; links to all matches.
- **Match page** – Hole-by-hole scores, Stableford points per hole (for 2v2), match play result (for 1v1), and a form to enter/update scores.
- **Admin** (PIN-protected) – Add players and assign to a team; create sessions (with “counts for team competition”); create foursomes and matches (2v2 Stableford or 1v1 match play, 9 or 18 holes); set match status (Not started / In progress / Complete).

Saturday afternoon session can be created with “Counts for team competition” unchecked so it is excluded from the team totals.
