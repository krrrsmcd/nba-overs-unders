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

/** Our lifecycle status for a balldontlie game. */
export function gameStatus(g: BdlGame): "scheduled" | "in_progress" | "final" {
  const state = g.status_state?.toLowerCase();
  if (state === "final" || g.status === "Final") return "final";
  if (state === "in_progress" || /qtr|half|ot/i.test(g.status)) return "in_progress";
  return "scheduled";
}
