/**
 * Key matchups: games whose result swings the point gap between players by 2.
 *
 * Each NBA team is drafted at most once per league, so a game touches at most two picks.
 * A game is key when both teams are drafted and either
 *   - head-to-head: different players picked the same side (one of them gains 1, the other doesn't), or
 *   - double-or-nothing: one player picked opposite sides (they gain 2 or 0).
 * Every other game moves any gap by 1 point or less.
 */

import type { DatedScoredGame } from "@/lib/insights";
import type { PickRow } from "@/lib/scoring";

export type KeyMatchup<G extends DatedScoredGame = DatedScoredGame> = {
  game: G;
  homePick: PickRow;
  awayPick: PickRow;
};

const STATUS_ORDER = { in_progress: 0, scheduled: 1, final: 2, postponed: 3 } as const;

export function isKeyMatchup(home: PickRow, away: PickRow): boolean {
  return home.playerId === away.playerId ? home.side !== away.side : home.side === away.side;
}

/** Key matchups on one schedule date: live games, then upcoming by tipoff, then finished games. */
export function keyMatchups<G extends DatedScoredGame>(games: G[], picks: PickRow[], date: string): KeyMatchup<G>[] {
  const pickOf = new Map(picks.map((pk) => [pk.nbaTeamId, pk]));
  const out: KeyMatchup<G>[] = [];
  for (const game of games) {
    if (game.gameDate !== date || !game.counts || game.status === "postponed") continue;
    const homePick = pickOf.get(game.homeTeamId);
    const awayPick = pickOf.get(game.awayTeamId);
    if (homePick && awayPick && isKeyMatchup(homePick, awayPick)) out.push({ game, homePick, awayPick });
  }
  const tip = (g: DatedScoredGame) => g.tipoffAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return out.sort(
    (a, b) =>
      STATUS_ORDER[a.game.status] - STATUS_ORDER[b.game.status] ||
      tip(a.game) - tip(b.game) ||
      a.game.homeTeamId.localeCompare(b.game.homeTeamId),
  );
}
