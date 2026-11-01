/**
 * A day's matchups: every counting game on a schedule date, with the pick on each team.
 *
 * Each NBA team is drafted at most once per league, so a game touches at most two picks.
 */

import type { DatedScoredGame } from "@/lib/insights";
import type { PickRow } from "@/lib/scoring";

export type Matchup<G extends DatedScoredGame = DatedScoredGame> = {
  game: G;
  homePick: PickRow;
  awayPick: PickRow;
};

const STATUS_ORDER = { in_progress: 0, scheduled: 1, final: 2, postponed: 3 } as const;

/**
 * A "key" game swings the gap between players by 2: head-to-head (different players picked the
 * same side) or double-or-nothing (one player picked opposite sides). Not currently shown.
 */
export function isKeyMatchup(home: PickRow, away: PickRow): boolean {
  return home.playerId === away.playerId ? home.side !== away.side : home.side === away.side;
}

type Stake = { score: number; side: "W" | "L"; ownerId: string };

/**
 * Who scored from a finished game. One owner on both teams scores +2, +1 or +0 as a single
 * entry; otherwise each owner whose pick paid off gets +1 (none, one or both). Null for a tie.
 */
export function finalOutcome<S extends Stake>(home: S, away: S): { who: S; points: number }[] | null {
  if (home.score === away.score) return null;
  const homeWon = home.score > away.score;
  const homeScored = home.side === (homeWon ? "W" : "L");
  const awayScored = away.side === (homeWon ? "L" : "W");
  if (home.ownerId === away.ownerId) return [{ who: home, points: Number(homeScored) + Number(awayScored) }];
  return [
    ...(homeScored ? [{ who: home, points: 1 }] : []),
    ...(awayScored ? [{ who: away, points: 1 }] : []),
  ];
}

/** Every matchup on one schedule date: live games, then upcoming by tipoff, then finished games. */
export function dayMatchups<G extends DatedScoredGame>(games: G[], picks: PickRow[], date: string): Matchup<G>[] {
  const pickOf = new Map(picks.map((pk) => [pk.nbaTeamId, pk]));
  const out: Matchup<G>[] = [];
  for (const game of games) {
    if (game.gameDate !== date || !game.counts || game.status === "postponed") continue;
    const homePick = pickOf.get(game.homeTeamId);
    const awayPick = pickOf.get(game.awayTeamId);
    if (homePick && awayPick) out.push({ game, homePick, awayPick });
  }
  const tip = (g: DatedScoredGame) => g.tipoffAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return out.sort(
    (a, b) =>
      STATUS_ORDER[a.game.status] - STATUS_ORDER[b.game.status] ||
      tip(a.game) - tip(b.game) ||
      a.game.homeTeamId.localeCompare(b.game.homeTeamId),
  );
}
