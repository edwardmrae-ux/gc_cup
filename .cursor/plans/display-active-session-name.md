# Display active session name (layout)

## Goal

Show the **active session’s display name** in the app shell so it appears **directly above** the main page content—on the leaderboard, that is **above** the `Leaderboard` heading, team score, and the match cards in [`MatchesSection`](app/MatchesSection.tsx) (i.e. first thing inside the main column, before `{children}`).

**Implementation lives in [app/layout.tsx](app/layout.tsx)**. Do **not** add a second copy of the same line in [app/page.tsx](app/page.tsx), or the home page would show the session name twice.

## Scope note (root layout)

[app/layout.tsx](app/layout.tsx) wraps **all** routes, so the session name line will appear on **every** page (e.g. home and `/admin`) when an active session is set, not only on the leaderboard. That matches “also update `layout.tsx`” for a single global placement. If a route-only display is required later, a nested `layout` under a route group can be used instead of the root.

## Data (layout has no `allMatches`)

The root layout does not load [`getAllMatches`](lib/leaderboard.ts). Use:

1. [`getActiveSessionId`](lib/activeSessionStore.ts) (already on disk / env).
2. A **new small server helper** (e.g. in `lib/`—could be `getActiveSessionNameFromDb.ts` or added next to the active session store) that:
   - returns `null` if `activeSessionId` is null/empty;
   - otherwise uses the Supabase server client to `select("name")` (or `id, name`) from `sessions` where `id` equals the active id, and returns the name string or `null` on miss/error.

This covers the **edge case** where no matches exist yet but a session is already marked active: the name still resolves from `sessions`, not from match rows.

## UI

- Make `RootLayout` an **`async` server component** (supported in the App Router).
- Inside `<main>`, **before** `{children}`, conditionally render a line when `activeSessionName` is a non-empty string (e.g. `text-slate-700` / `font-medium` / bottom margin so it sits clearly above page content; align with `max-w-4xl mx-auto px-4` to match the main column).

## Files

| File | Change |
|------|--------|
| New or existing `lib/*` | Server helper: `getActiveSessionId` + Supabase `sessions` lookup by id → `string \| null`. |
| [app/layout.tsx](app/layout.tsx) | `async` layout, await helper, render session name line above `children` in `main`. |

## Not in this plan

- [app/page.tsx](app/page.tsx) — no extra session line (avoid duplicate with layout).
- Admin or non-layout-specific refactors.
