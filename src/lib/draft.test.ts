import { describe, expect, it } from "vitest";
import { isPermutationOf, picksPerPlayer, positionForPick, roundOf, shuffle, TOTAL_PICKS } from "./draft";

const orderFor = (size: number) => Array.from({ length: TOTAL_PICKS }, (_, n) => positionForPick(n, size));

describe("snake order", () => {
  it("3 players: 0,1,2 then 2,1,0", () => {
    expect(orderFor(3).slice(0, 9)).toEqual([0, 1, 2, 2, 1, 0, 0, 1, 2]);
  });

  it("2 players: 0,1,1,0,0,1…", () => {
    expect(orderFor(2).slice(0, 6)).toEqual([0, 1, 1, 0, 0, 1]);
  });

  it("5 players: second round reverses", () => {
    expect(orderFor(5).slice(0, 10)).toEqual([0, 1, 2, 3, 4, 4, 3, 2, 1, 0]);
  });

  for (const size of [2, 3, 5]) {
    it(`${size} players: 30 picks split evenly (${picksPerPlayer(size)} each)`, () => {
      const counts = Array(size).fill(0);
      for (const p of orderFor(size)) counts[p]++;
      expect(counts).toEqual(Array(size).fill(picksPerPlayer(size)));
      expect(roundOf(TOTAL_PICKS - 1, size)).toBe(picksPerPlayer(size) - 1);
    });
  }
});

describe("shuffle", () => {
  it("keeps every item exactly once", () => {
    const ids = ["a", "b", "c", "d", "e"];
    for (let k = 0; k < 50; k++) expect(isPermutationOf(shuffle(ids), ids)).toBe(true);
  });
});

describe("isPermutationOf", () => {
  it("rejects duplicates, missing and extra ids", () => {
    expect(isPermutationOf(["a", "a", "b"], ["a", "b", "c"])).toBe(false);
    expect(isPermutationOf(["a", "b"], ["a", "b", "c"])).toBe(false);
    expect(isPermutationOf(["a", "b", "x"], ["a", "b", "c"])).toBe(false);
    expect(isPermutationOf(["c", "a", "b"], ["a", "b", "c"])).toBe(true);
  });
});
