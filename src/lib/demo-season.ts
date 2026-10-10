/** Deterministic fake mid-season data for the demo scoreboard (no database). */

import { NBA_TEAMS } from "@/db/teams";
import { positionForPick, TOTAL_PICKS } from "@/lib/draft";
import type { DatedScoredGame } from "@/lib/insights";
import type { PickRow } from "@/lib/scoring";
import { addDays, REGULAR_SEASON_START } from "@/lib/sync";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_TODAY = "2027-01-21";

export function demoSeason(seed = 2027) {
  const random = rng(seed);
  const strength = new Map(NBA_TEAMS.map((t) => [t.id, t.winTotals.betmgm / 82]));

  // Players and a plausible snake draft: mostly take the side with the most expected points.
  const players = [
    { id: "p1", teamName: "Buzzer Beaters", draftPosition: 0 },
    { id: "p2", teamName: "Air Ballers", draftPosition: 1 },
    { id: "p3", teamName: "Brick City", draftPosition: 2 },
  ];
  const pool = [...NBA_TEAMS].sort((a, b) => Math.abs(b.winTotals.betmgm - 41) - Math.abs(a.winTotals.betmgm - 41));
  const picks: PickRow[] = [];
  for (let n = 0; n < TOTAL_PICKS; n++) {
    const i = Math.min(pool.length - 1, Math.floor(random() * Math.min(4, pool.length)));
    const [team] = pool.splice(i, 1);
    picks.push({
      playerId: players[positionForPick(n, players.length)].id,
      nbaTeamId: team.id,
      side: team.winTotals.betmgm >= 41 ? "W" : "L",
      pickNumber: n + 1,
    });
  }

  // Three months of games: each team plays roughly every other day.
  const games: DatedScoredGame[] = [];
  for (let date = REGULAR_SEASON_START; date < DEMO_TODAY; date = addDays(date, 1)) {
    const teams = NBA_TEAMS.map((t) => t.id).sort(() => random() - 0.5).slice(0, 12 + Math.floor(random() * 8));
    for (let k = 0; k + 1 < teams.length; k += 2) {
      const [home, away] = [teams[k], teams[k + 1]];
      const a = strength.get(home)! + 0.03;
      const b = strength.get(away)!;
      const homeWins = random() < a / (a + b);
      const loser = 95 + Math.floor(random() * 25);
      const winner = loser + 1 + Math.floor(random() * 18);
      games.push({
        gameDate: date,
        homeTeamId: home,
        awayTeamId: away,
        homeScore: homeWins ? winner : loser,
        awayScore: homeWins ? loser : winner,
        status: "final",
        counts: true,
      });
    }
  }
  return { players, picks, games };
}
