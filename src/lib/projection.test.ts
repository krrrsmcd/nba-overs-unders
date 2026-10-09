import { describe, expect, it } from "vitest";
import { projectedPickPoints, projectedWins } from "./projection";

describe("projectedWins", () => {
  it("equals the preseason line before any games", () => {
    expect(projectedWins(0, 0, 50.5)).toBeCloseTo(50.5);
    expect(projectedPickPoints("L", { wins: 0, losses: 0 }, 50.5)).toBeCloseTo(31.5);
  });

  it("moves only a little after a hot or cold start", () => {
    const hot = projectedWins(5, 0, 41);
    expect(hot).toBeGreaterThan(41);
    expect(hot).toBeLessThan(50);
    const cold = projectedWins(2, 3, 50);
    expect(cold).toBeGreaterThan(44);
    expect(cold).toBeLessThan(50);
  });

  it("follows the actual pace late in the season", () => {
    // 60-15 team picked to win 40: projection should be near its pace, not the line.
    const p = projectedWins(60, 15, 40);
    expect(p).toBeGreaterThan(64);
    expect(p).toBeLessThan(66);
  });

  it("is exact once all 82 games are played", () => {
    expect(projectedWins(55, 27, 30)).toBe(55);
    expect(projectedPickPoints("L", { wins: 55, losses: 27 }, 30)).toBe(27);
  });

  it("never projects fewer wins than already won or more than possible", () => {
    for (const [w, l] of [
      [10, 0],
      [0, 10],
      [30, 30],
    ]) {
      const p = projectedWins(w, l, 41);
      expect(p).toBeGreaterThanOrEqual(w);
      expect(p).toBeLessThanOrEqual(82 - l);
    }
  });
});
