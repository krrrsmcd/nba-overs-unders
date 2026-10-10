/** Season insights: current team streaks, the week's biggest mover, and the end-of-season state. */

import type { ScoredGame } from "@/lib/scoring";

export type DatedScoredGame = ScoredGame & { gameDate: string; tipoffAt?: Date | null };
export type Streak = { result: "W" | "L"; length: number };

export const HOT_STREAK = 4;

/** Each team's current run of consecutive wins or losses (final, counting games only). */
export function teamStreaks(games: DatedScoredGame[]): Map<string, Streak> {
  const done = games
    .filter((g) => g.status === "final" && g.counts && g.homeScore !== g.awayScore)
    .sort(
      (a, b) =>
        a.gameDate.localeCompare(b.gameDate) ||
        (a.tipoffAt?.getTime() ?? 0) - (b.tipoffAt?.getTime() ?? 0),
    );
  const out = new Map<string, Streak>();
  const push = (team: string, result: "W" | "L") => {
    const s = out.get(team);
    out.set(team, s && s.result === result ? { result, length: s.length + 1 } : { result, length: 1 });
  };
  for (const g of done) {
    const homeWon = g.homeScore > g.awayScore;
    push(g.homeTeamId, homeWon ? "W" : "L");
    push(g.awayTeamId, homeWon ? "L" : "W");
  }
  return out;
}

/** How many games in a row a pick has scored (its team's streak, if it runs the pick's way). */
export function pickStreak(side: "W" | "L", streak: Streak | undefined): number {
  return streak && streak.result === side ? streak.length : 0;
}

/** Points each player gained over the last `days` days of the race series. */
export function recentGains(
  dates: string[],
  series: { playerId: string; values: number[] }[],
  days = 7,
): Map<string, number> {
  const out = new Map<string, number>();
  if (dates.length === 0) return out;
  const startIndex = Math.max(0, dates.length - 1 - days);
  for (const s of series) {
    const end = s.values.at(-1) ?? 0;
    // Before the window existed, the baseline is 0.
    const base = dates.length - 1 - days >= 0 ? (s.values[startIndex] ?? 0) : 0;
    out.set(s.playerId, end - base);
  }
  return out;
}

/** The player who gained the most in the window, or null on a tie for the top or no gains. */
export function biggestMover(gains: Map<string, number>): { playerId: string; gain: number } | null {
  const sorted = [...gains.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0 || sorted[0][1] <= 0) return null;
  if (sorted.length > 1 && sorted[1][1] === sorted[0][1]) return null;
  return { playerId: sorted[0][0], gain: sorted[0][1] };
}

/** The regular season is over once the calendar passes its last day and nothing counting is left to play. */
export function isSeasonOver(today: string, seasonEnd: string, games: DatedScoredGame[]): boolean {
  if (today <= seasonEnd) return false;
  return !games.some((g) => g.counts && (g.status === "scheduled" || g.status === "in_progress"));
}
