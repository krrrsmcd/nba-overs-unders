/** Pure scoring rules: team records from games, points per pick, and the leaderboard. */

export type ScoredGame = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "in_progress" | "final" | "postponed";
  counts: boolean;
};

export type Record = { wins: number; losses: number };

/** Wins and losses per team from final, counting games. */
export function teamRecords(games: ScoredGame[]): Map<string, Record> {
  const out = new Map<string, Record>();
  const rec = (id: string) => {
    let r = out.get(id);
    if (!r) out.set(id, (r = { wins: 0, losses: 0 }));
    return r;
  };
  for (const g of games) {
    if (g.status !== "final" || !g.counts || g.homeScore === g.awayScore) continue;
    const homeWon = g.homeScore > g.awayScore;
    rec(g.homeTeamId)[homeWon ? "wins" : "losses"]++;
    rec(g.awayTeamId)[homeWon ? "losses" : "wins"]++;
  }
  return out;
}

export function pickPoints(side: "W" | "L", record: Record | undefined): number {
  if (!record) return 0;
  return side === "W" ? record.wins : record.losses;
}

export type PickRow = { playerId: string; nbaTeamId: string; side: "W" | "L"; pickNumber: number };
export type PlayerRow = { id: string; teamName: string | null };

export type Standing = {
  playerId: string;
  teamName: string;
  points: number;
  rank: number;
  picks: (PickRow & { record: Record; points: number })[];
};

/** Players by total points, highest first. Tied players share a rank (1, 1, 3). */
export function leaderboard(players: PlayerRow[], picks: PickRow[], records: Map<string, Record>): Standing[] {
  const rows = players.map((p) => {
    const mine = picks
      .filter((pk) => pk.playerId === p.id)
      .map((pk) => {
        const record = records.get(pk.nbaTeamId) ?? { wins: 0, losses: 0 };
        return { ...pk, record, points: pickPoints(pk.side, record) };
      })
      .sort((a, b) => b.points - a.points || a.pickNumber - b.pickNumber);
    return {
      playerId: p.id,
      teamName: p.teamName ?? "Unnamed",
      points: mine.reduce((sum, pk) => sum + pk.points, 0),
      rank: 0,
      picks: mine,
    };
  });
  rows.sort((a, b) => b.points - a.points || a.teamName.localeCompare(b.teamName));
  rows.forEach((r, i) => {
    r.rank = i > 0 && r.points === rows[i - 1].points ? rows[i - 1].rank : i + 1;
  });
  return rows;
}
