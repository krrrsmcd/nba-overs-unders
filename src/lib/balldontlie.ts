import "server-only";

/** Minimal client for the balldontlie NBA games API (free tier: 5 requests/minute). */

const BASE = process.env.BALLDONTLIE_BASE_URL ?? "https://api.balldontlie.io/v1";

export type BdlGame = {
  id: number;
  date: string; // "YYYY-MM-DD", US Eastern
  datetime: string | null; // ISO UTC tip-off
  season: number;
  status: string;
  status_state?: string;
  postseason: boolean;
  ist_stage?: string | null;
  home_team: { abbreviation: string };
  visitor_team: { abbreviation: string };
  home_team_score: number;
  visitor_team_score: number;
  /** 0 before tip-off, 1–4 quarters, 5+ overtime. */
  period?: number | null;
  /** Clock left in the period, e.g. "3:44"; empty or "Final" outside live play. */
  time?: string | null;
};

export class RateLimitedError extends Error {}

/** One page of games for a season between two dates (inclusive). */
export async function fetchGamesPage(opts: {
  season: number;
  startDate: string;
  endDate: string;
  cursor?: number;
  signal?: AbortSignal;
}): Promise<{ games: BdlGame[]; nextCursor?: number }> {
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) throw new Error("BALLDONTLIE_API_KEY is not set");
  const params = new URLSearchParams({
    "seasons[]": String(opts.season),
    start_date: opts.startDate,
    end_date: opts.endDate,
    per_page: "100",
  });
  if (opts.cursor) params.set("cursor", String(opts.cursor));

  const res = await fetch(`${BASE}/games?${params}`, {
    headers: { Authorization: key },
    cache: "no-store",
    signal: opts.signal,
  });
  if (res.status === 429) throw new RateLimitedError("balldontlie rate limit");
  if (!res.ok) throw new Error(`balldontlie ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { data: BdlGame[]; meta?: { next_cursor?: number | null } };
  return { games: body.data, nextCursor: body.meta?.next_cursor ?? undefined };
}

/**
 * Quarter and clock for a live game, e.g. "Q3 3:44", "HALF", "END Q1", "OT 1:20", "2OT".
 * Null unless the game is in progress with a known period.
 */
export function liveClockLabel(g: BdlGame): string | null {
  if (gameStatus(g) !== "in_progress") return null;
  if (/half/i.test(g.status)) return "HALF";
  const p = g.period ?? 0;
  if (p <= 0) return null;
  const q = p <= 4 ? `Q${p}` : p === 5 ? "OT" : `${p - 4}OT`;
  if (/^end/i.test(g.status)) return `END ${q}`;
  const t = (g.time ?? "").trim();
  return /^\d/.test(t) ? `${q} ${t}` : q;
}

/** Our lifecycle status for a balldontlie game. "postponed" covers postponed, canceled and abandoned games. */
export function gameStatus(g: BdlGame): "scheduled" | "in_progress" | "final" | "postponed" {
  const state = g.status_state?.toLowerCase();
  if (state === "final" || g.status === "Final") return "final";
  if (state === "postponed" || state === "canceled" || state === "cancelled" || state === "abandoned") return "postponed";
  if (state === "in_progress" || state === "delayed" || state === "suspended" || /qtr|half|ot/i.test(g.status))
    return "in_progress";
  return "scheduled";
}
