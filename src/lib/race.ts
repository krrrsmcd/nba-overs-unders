/** Cumulative points per player for each calendar day of the season so far. */

import type { PickRow, ScoredGame } from "@/lib/scoring";

type DatedGame = ScoredGame & { gameDate: string };

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function raceSeries(
  games: DatedGame[],
  picks: PickRow[],
  playerIds: string[],
): { dates: string[]; series: { playerId: string; values: number[] }[] } {
  const done = games
    .filter((g) => g.status === "final" && g.counts && g.homeScore !== g.awayScore)
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate));
  if (done.length === 0) return { dates: [], series: playerIds.map((playerId) => ({ playerId, values: [] })) };

  // Who scores when a team wins or loses.
  const onWin = new Map<string, string>();
  const onLoss = new Map<string, string>();
  for (const p of picks) (p.side === "W" ? onWin : onLoss).set(p.nbaTeamId, p.playerId);

  const first = done[0].gameDate;
  const last = done[done.length - 1].gameDate;
  const dates: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) dates.push(d);

  const totals = new Map(playerIds.map((id) => [id, 0]));
  const values = new Map(playerIds.map((id) => [id, [] as number[]]));
  let i = 0;
  for (const date of dates) {
    for (; i < done.length && done[i].gameDate === date; i++) {
      const g = done[i];
      const [winner, loser] = g.homeScore > g.awayScore ? [g.homeTeamId, g.awayTeamId] : [g.awayTeamId, g.homeTeamId];
      for (const pid of [onWin.get(winner), onLoss.get(loser)]) {
        if (pid && totals.has(pid)) totals.set(pid, totals.get(pid)! + 1);
      }
    }
    for (const id of playerIds) values.get(id)!.push(totals.get(id)!);
  }
  return { dates, series: playerIds.map((playerId) => ({ playerId, values: values.get(playerId)! })) };
}
