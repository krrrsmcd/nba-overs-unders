import { describe, expect, it } from "vitest";
import type { DatedScoredGame } from "./insights";
import { isKeyMatchup, keyMatchups } from "./matchups";
import type { PickRow } from "./scoring";

const pick = (playerId: string, nbaTeamId: string, side: "W" | "L", pickNumber = 1): PickRow => ({
  playerId,
  nbaTeamId,
  side,
  pickNumber,
});

const game = (homeTeamId: string, awayTeamId: string, over: Partial<DatedScoredGame> = {}): DatedScoredGame => ({
  gameDate: "2026-10-31",
  homeTeamId,
  awayTeamId,
  homeScore: 0,
  awayScore: 0,
  status: "scheduled",
  counts: true,
  tipoffAt: null,
  ...over,
});

describe("isKeyMatchup", () => {
  it("is key for head-to-head: different players, same side", () => {
    expect(isKeyMatchup(pick("a", "CHI", "W"), pick("b", "NYK", "W"))).toBe(true);
    expect(isKeyMatchup(pick("a", "CHI", "L"), pick("b", "NYK", "L"))).toBe(true);
  });
  it("is key for double-or-nothing: same player, opposite sides", () => {
    expect(isKeyMatchup(pick("a", "CHI", "W"), pick("a", "NYK", "L"))).toBe(true);
  });
  it("is not key when the result can't change a gap by 2", () => {
    expect(isKeyMatchup(pick("a", "CHI", "W"), pick("b", "NYK", "L"))).toBe(false); // both gain or neither
    expect(isKeyMatchup(pick("a", "CHI", "W"), pick("a", "NYK", "W"))).toBe(false); // always +1
  });
});

describe("keyMatchups", () => {
  const picks = [
    pick("a", "CHI", "W"),
    pick("b", "NYK", "W"),
    pick("a", "BOS", "W"),
    pick("a", "MIA", "L"),
    pick("c", "LAL", "W"),
    pick("b", "DEN", "L"),
  ];

  it("keeps only key games on the given date", () => {
    const games = [
      game("CHI", "NYK"), // head-to-head
      game("BOS", "MIA"), // double-or-nothing
      game("LAL", "DEN"), // locked: both gain or neither
      game("CHI", "PHX"), // only one drafted team
      game("CHI", "NYK", { gameDate: "2026-11-01" }), // other day
      game("CHI", "NYK", { counts: false }), // doesn't count
      game("CHI", "NYK", { status: "postponed" }),
    ];
    const out = keyMatchups(games, picks, "2026-10-31");
    expect(out.map((m) => `${m.game.homeTeamId}-${m.game.awayTeamId}`).sort()).toEqual(["BOS-MIA", "CHI-NYK"]);
    const h2h = out.find((m) => m.game.homeTeamId === "CHI")!;
    expect(h2h.homePick.playerId).toBe("a");
    expect(h2h.awayPick.playerId).toBe("b");
  });

  it("orders live games first, then upcoming by tipoff, then finished", () => {
    const at = (h: number) => new Date(`2026-10-31T${String(h).padStart(2, "0")}:00:00Z`);
    const games = [
      game("CHI", "NYK", { status: "final", tipoffAt: at(17) }),
      game("BOS", "MIA", { status: "scheduled", tipoffAt: at(23) }),
      game("NYK", "CHI", { status: "scheduled", tipoffAt: at(20) }),
      game("MIA", "BOS", { status: "in_progress", tipoffAt: at(19) }),
      game("LAL", "NYK", { status: "scheduled", tipoffAt: null }), // c-W vs b-W: key, unknown tipoff goes last
    ];
    const order = keyMatchups(games, picks, "2026-10-31").map((m) => `${m.game.homeTeamId}-${m.game.awayTeamId}`);
    expect(order).toEqual(["MIA-BOS", "NYK-CHI", "BOS-MIA", "LAL-NYK", "CHI-NYK"]);
  });

  it("returns nothing for a day without key games", () => {
    expect(keyMatchups([game("LAL", "DEN")], picks, "2026-10-31")).toEqual([]);
  });
});
