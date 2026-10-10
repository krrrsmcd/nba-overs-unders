import { describe, expect, it } from "vitest";
import { biggestMover, isSeasonOver, pickStreak, recentGains, teamStreaks, type DatedScoredGame } from "./insights";

const g = (gameDate: string, home: string, away: string, hs: number, as: number, extra: Partial<DatedScoredGame> = {}) =>
  ({ gameDate, homeTeamId: home, awayTeamId: away, homeScore: hs, awayScore: as, status: "final", counts: true, ...extra }) as DatedScoredGame;

describe("teamStreaks", () => {
  const games = [
    g("2026-10-20", "BOS", "NYK", 90, 100), // BOS L
    g("2026-10-22", "BOS", "MIA", 110, 100), // BOS W
    g("2026-10-24", "ORL", "BOS", 90, 100), // BOS W
    g("2026-10-26", "BOS", "CHI", 120, 100), // BOS W
    g("2026-10-28", "BOS", "CHI", 101, 100), // BOS W
    g("2026-10-30", "BOS", "CHI", 0, 0, { status: "scheduled" }),
    g("2026-10-25", "BOS", "DET", 50, 99, { counts: false }), // ignored
  ];
  it("tracks the current run per team", () => {
    const s = teamStreaks(games);
    expect(s.get("BOS")).toEqual({ result: "W", length: 4 });
    expect(s.get("CHI")).toEqual({ result: "L", length: 2 });
  });
  it("only counts toward a pick on the matching side", () => {
    const s = teamStreaks(games).get("BOS");
    expect(pickStreak("W", s)).toBe(4);
    expect(pickStreak("L", s)).toBe(0);
  });
});

describe("weekly movers", () => {
  const dates = Array.from({ length: 10 }, (_, i) => `2026-10-${String(20 + i).padStart(2, "0")}`);
  const series = [
    { playerId: "a", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { playerId: "b", values: [5, 5, 5, 5, 5, 6, 6, 6, 6, 7] },
  ];
  it("measures gains over the last 7 days", () => {
    const gains = recentGains(dates, series);
    expect(gains.get("a")).toBe(7);
    expect(gains.get("b")).toBe(2);
    expect(biggestMover(gains)).toEqual({ playerId: "a", gain: 7 });
  });
  it("has no mover on a tie or with no gains", () => {
    expect(biggestMover(new Map([["a", 3], ["b", 3]]))).toBeNull();
    expect(biggestMover(new Map([["a", 0]]))).toBeNull();
  });
});

describe("isSeasonOver", () => {
  it("waits for the last day and for every counting game to finish", () => {
    expect(isSeasonOver("2027-04-11", "2027-04-11", [])).toBe(false);
    expect(isSeasonOver("2027-04-12", "2027-04-11", [g("2027-04-11", "A", "B", 0, 0, { status: "in_progress" })])).toBe(false);
    expect(isSeasonOver("2027-04-12", "2027-04-11", [g("2027-04-11", "A", "B", 1, 0)])).toBe(true);
  });
});
