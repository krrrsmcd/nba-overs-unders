/**
 * Projected final records: blend the preseason BetMGM win total with the team's current pace.
 * The preseason line counts as PRIOR_GAMES games of evidence, so early results move the
 * projection a little and late-season results move it a lot.
 */

import { GAMES_PER_TEAM } from "@/db/teams";

export const PRIOR_GAMES = 30;

export function projectedWins(wins: number, losses: number, preseasonWins: number): number {
  const played = wins + losses;
  const remaining = Math.max(0, GAMES_PER_TEAM - played);
  const priorRate = preseasonWins / GAMES_PER_TEAM;
  const rate = (priorRate * PRIOR_GAMES + wins) / (PRIOR_GAMES + played);
  return wins + rate * remaining;
}

/** Projected final points for one pick: projected wins for a Wins pick, projected losses for a Losses pick. */
export function projectedPickPoints(
  side: "W" | "L",
  record: { wins: number; losses: number },
  preseasonWins: number,
): number {
  const w = projectedWins(record.wins, record.losses, preseasonWins);
  return side === "W" ? w : GAMES_PER_TEAM - w;
}
