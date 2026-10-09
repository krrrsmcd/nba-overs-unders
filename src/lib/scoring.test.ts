import { describe, expect, it } from "vitest";
import { leaderboard, pickPoints, teamRecords, type ScoredGame } from "./scoring";

const g = (home: string, away: string, hs: number, as: number, extra: Partial<ScoredGame> = {}): ScoredGame => ({
  homeTeamId: home,
  awayTeamId: away,
  homeScore: hs,
  awayScore: as,
  status: "final",
  counts: true,
  ...extra,
});

describe("teamRecords", () => {
  it("counts final regular-season games only", () => {
    const recs = teamRecords([
      g("BOS", "DET", 110, 100),
      g("DET", "BOS", 99, 101),
      g("BOS", "NYK", 0, 0, { status: "scheduled" }),
      g("BOS", "NYK", 50, 40, { status: "in_progress" }),
      g("BOS", "NYK", 90, 120, { counts: false }), // e.g. playoffs or NBA Cup final
    ]);
    expect(recs.get("BOS")).toEqual({ wins: 2, losses: 0 });
    expect(recs.get("DET")).toEqual({ wins: 0, losses: 2 });
    expect(recs.get("NYK")).toBeUndefined();
  });
});

describe("pickPoints", () => {
  it("scores wins or losses depending on the side", () => {
    expect(pickPoints("W", { wins: 2, losses: 4 })).toBe(2);
    expect(pickPoints("L", { wins: 2, losses: 4 })).toBe(4);
    expect(pickPoints("W", undefined)).toBe(0);
  });
});

describe("leaderboard", () => {
  const records = teamRecords([g("CHI", "MIA", 100, 90), g("CHI", "MIA", 80, 90), g("MIA", "LAL", 101, 99)]);
  // CHI 1-1, MIA 2-1, LAL 0-1
  const players = [
    { id: "a", teamName: "Alpha" },
    { id: "b", teamName: "Bravo" },
    { id: "c", teamName: "Charlie" },
  ];

  it("sums picks and ranks with shared ties", () => {
    const rows = leaderboard(
      players,
      [
        { playerId: "a", nbaTeamId: "CHI", side: "W", pickNumber: 1 }, // 1
        { playerId: "a", nbaTeamId: "LAL", side: "L", pickNumber: 4 }, // 1
        { playerId: "b", nbaTeamId: "MIA", side: "W", pickNumber: 2 }, // 2
        { playerId: "c", nbaTeamId: "MIA", side: "L", pickNumber: 3 }, // 1 (illustrative)
      ],
      records,
    );
    expect(rows.map((r) => [r.teamName, r.points, r.rank])).toEqual([
      ["Alpha", 2, 1],
      ["Bravo", 2, 1],
      ["Charlie", 1, 3],
    ]);
    expect(rows[0].picks.map((p) => p.points)).toEqual([1, 1]);
  });

  it("gives everyone rank 1 before any games", () => {
    const rows = leaderboard(players, [], new Map());
    expect(rows.every((r) => r.rank === 1 && r.points === 0)).toBe(true);
  });
});
