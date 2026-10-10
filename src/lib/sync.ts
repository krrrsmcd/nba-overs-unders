import "server-only";
import { and, eq, gte, isNull, lt, lte, notInArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { NBA_TEAMS } from "@/db/teams";
import { fetchGamesPage, gameStatus, RateLimitedError, type BdlGame } from "@/lib/balldontlie";

export const SEASON = 2026; // balldontlie season id for 2026–27
export const REGULAR_SEASON_START = "2026-10-20";
export const REGULAR_SEASON_END = "2027-04-11";

const FRESH_MS = 10 * 60 * 1000; // sync at most every 10 minutes
const LOCK_MS = 30 * 1000;
const CHUNK_DAYS = 7; // ~50 games: one 100-per-page request
const MAX_REQUESTS = 4; // stay under the free tier's 5 requests/minute
const STUCK_DAYS = 3; // a game still unfinished this long after its date is treated as settled

const TEAM_IDS = new Set(NBA_TEAMS.map((t) => t.id));

/** Regular season only: no playoffs, play-in (after the last regular-season day) or NBA Cup final. */
export function gameCounts(g: Pick<BdlGame, "postseason" | "ist_stage" | "date">): boolean {
  return (
    !g.postseason &&
    g.ist_stage !== "Championship" &&
    g.date >= REGULAR_SEASON_START &&
    g.date <= REGULAR_SEASON_END
  );
}

/** Calendar date in US Eastern time (the NBA's schedule date). */
export function easternDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The current time. SYNC_FAKE_NOW lets local tests pretend it's mid-season (never in production). */
export function currentTime(): Date {
  const fake = process.env.VERCEL_ENV !== "production" ? process.env.SYNC_FAKE_NOW : undefined;
  return fake ? new Date(fake) : new Date();
}

const minDate = (...ds: string[]) => ds.reduce((a, b) => (a < b ? a : b));
const maxDate = (...ds: string[]) => ds.reduce((a, b) => (a > b ? a : b));

async function upsertGames(games: BdlGame[]) {
  const rows = games
    .filter((g) => TEAM_IDS.has(g.home_team.abbreviation) && TEAM_IDS.has(g.visitor_team.abbreviation))
    .map((g) => ({
      id: `bdl:${g.id}`,
      gameDate: g.date.slice(0, 10),
      tipoffAt: g.datetime ? new Date(g.datetime) : null,
      homeTeamId: g.home_team.abbreviation,
      awayTeamId: g.visitor_team.abbreviation,
      homeScore: g.home_team_score ?? 0,
      awayScore: g.visitor_team_score ?? 0,
      status: gameStatus(g),
      postseason: g.postseason,
      counts: gameCounts({ ...g, date: g.date.slice(0, 10) }),
      updatedAt: new Date(),
    }));
  if (rows.length === 0) return;
  await getDb()
    .insert(schema.games)
    .values(rows)
    .onConflictDoUpdate({
      target: schema.games.id,
      set: {
        gameDate: sql`excluded.game_date`,
        tipoffAt: sql`excluded.tipoff_at`,
        homeScore: sql`excluded.home_score`,
        awayScore: sql`excluded.away_score`,
        status: sql`excluded.status`,
        postseason: sql`excluded.postseason`,
        counts: sql`excluded.counts`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

/**
 * Pulls new results from balldontlie if the last sync is older than 10 minutes.
 * Safe to call on every page load: a DB lock keeps it to one sync at a time.
 */
export async function syncScores(now = currentTime()): Promise<"fresh" | "locked" | "synced" | "partial" | "error"> {
  const db = getDb();
  const [state] = await db.select().from(schema.syncState).where(eq(schema.syncState.id, 1));
  if (state?.lastSyncedAt && now.getTime() - state.lastSyncedAt.getTime() < FRESH_MS) return "fresh";
  if (!process.env.BALLDONTLIE_API_KEY) return "error";

  const locked = await db
    .update(schema.syncState)
    .set({ lockedUntil: new Date(now.getTime() + LOCK_MS) })
    .where(
      and(
        eq(schema.syncState.id, 1),
        or(isNull(schema.syncState.lockedUntil), lt(schema.syncState.lockedUntil, now)),
      ),
    )
    .returning({ id: schema.syncState.id });
  if (locked.length === 0) return "locked";

  let requests = 0;
  let result: "synced" | "partial" | "error" = "synced";
  const updates: Partial<typeof schema.syncState.$inferInsert> = {};
  try {
    // Learn the opening tip-off once, so league creation locks at the right moment.
    if (!state?.seasonOpenerAt) {
      requests++;
      const { games } = await fetchGamesPage({
        season: SEASON,
        startDate: REGULAR_SEASON_START,
        endDate: REGULAR_SEASON_START,
      });
      const tips = games.filter((g) => g.datetime).map((g) => new Date(g.datetime!).getTime());
      if (tips.length) updates.seasonOpenerAt = new Date(Math.min(...tips));
    }

    const today = easternDate(now);
    const yesterday = addDays(today, -1);
    const windowStart = state?.lastCompleteDate ? addDays(state.lastCompleteDate, 1) : REGULAR_SEASON_START;
    const windowEnd = minDate(today, REGULAR_SEASON_END);
    let fetchedThrough: string | null = null;

    for (let start = windowStart; start <= windowEnd; ) {
      const end = minDate(addDays(start, CHUNK_DAYS - 1), windowEnd);
      let cursor: number | undefined;
      let complete = true;
      do {
        if (requests >= MAX_REQUESTS) {
          complete = false;
          break;
        }
        requests++;
        const page = await fetchGamesPage({ season: SEASON, startDate: start, endDate: end, cursor });
        await upsertGames(page.games);
        cursor = page.nextCursor;
      } while (cursor);
      if (!complete) {
        result = "partial";
        break;
      }
      fetchedThrough = end;
      start = addDays(end, 1);
    }

    // Everything up to the day before the earliest unfinished game is settled.
    if (fetchedThrough) {
      const [pending] = await db
        .select({ d: sql<string | null>`min(${schema.games.gameDate})::text` })
        .from(schema.games)
        .where(
          and(
            // Ignore games that will never finish (postponed/canceled) and anything stuck
            // unfinished for 3+ days, so one odd game can't freeze score updates.
            gte(schema.games.gameDate, maxDate(windowStart, addDays(today, -STUCK_DAYS))),
            lte(schema.games.gameDate, fetchedThrough),
            notInArray(schema.games.status, ["final", "postponed"]),
          ),
        );
      const settled = minDate(fetchedThrough, yesterday, pending?.d ? addDays(pending.d, -1) : fetchedThrough);
      if (settled >= windowStart) updates.lastCompleteDate = settled;
    }
  } catch (err) {
    result = err instanceof RateLimitedError ? "partial" : "error";
    console.error("[sync] failed", err);
  }

  await db
    .update(schema.syncState)
    .set({
      ...updates,
      // On failure keep the old sync time and back off for 2 minutes via the lock.
      ...(result !== "error" ? { lastSyncedAt: now, lockedUntil: null } : { lockedUntil: new Date(now.getTime() + 120_000) }),
    })
    .where(eq(schema.syncState.id, 1));
  return result;
}

/** Last successful sync time, for the "updated X min ago" label. */
export async function getLastSyncedAt(): Promise<Date | null> {
  const [state] = await getDb()
    .select({ at: schema.syncState.lastSyncedAt })
    .from(schema.syncState)
    .where(eq(schema.syncState.id, 1));
  return state?.at ?? null;
}
