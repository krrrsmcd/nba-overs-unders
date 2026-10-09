import { describe, expect, it } from "vitest";
import { raceSeries } from "./race";
import { leaderboard, teamRecords } from "./scoring";

const g = (gameDate: string, home: string, away: string, hs: number, as: number) => ({
  gameDate,
  homeTeamId: home,
  awayTeamId: away,
  homeScore: hs,
  awayScore: as,
  status: "final" as const,
  counts: true,
});

describe("raceSeries", () => {
  const games = [g("2026-10-20", "BOS", "DET", 100, 90), g("2026-10-22", "DET", "BOS", 99, 98)];
  const picks = [
    { playerId: "a", nbaTeamId: "BOS", side: "W" as const, pickNumber: 1 },
    { playerId: "b", nbaTeamId: "DET", side: "L" as const, pickNumber: 2 },
  ];

  it("has one point per calendar day and ends at the leaderboard totals", () => {
    const r = raceSeries(games, picks, ["a", "b"]);
    expect(r.dates).toEqual(["2026-10-20", "2026-10-21", "2026-10-22"]);
    expect(r.series).toEqual([
      { playerId: "a", values: [1, 1, 1] },
      { playerId: "b", values: [1, 1, 1] },
    ]);
    const board = leaderboard(
      [
        { id: "a", teamName: "A" },
        { id: "b", teamName: "B" },
      ],
      picks,
      teamRecords(games),
    );
    for (const s of r.series) expect(s.values.at(-1)).toBe(board.find((x) => x.playerId === s.playerId)!.points);
  });

  it("is empty before any games", () => {
    expect(raceSeries([], picks, ["a"]).dates).toEqual([]);
  });
});
