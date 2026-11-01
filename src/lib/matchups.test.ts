import { describe, expect, it } from "vitest";
import type { DatedScoredGame } from "./insights";
import { dayMatchups, finalOutcome, isKeyMatchup } from "./matchups";
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

describe("dayMatchups", () => {
  const picks = [
    pick("a", "CHI", "W"),
    pick("b", "NYK", "W"),
    pick("a", "BOS", "W"),
    pick("a", "MIA", "L"),
    pick("c", "LAL", "W"),
    pick("b", "DEN", "L"),
  ];

  it("keeps every counting game on the given date", () => {
    const games = [
      game("CHI", "NYK"),
      game("BOS", "MIA"),
      game("LAL", "DEN"), // not key, still shown
      game("CHI", "PHX"), // undrafted team (can't happen with full drafts): skipped
      game("CHI", "NYK", { gameDate: "2026-11-01" }), // other day
      game("CHI", "NYK", { counts: false }), // doesn't count
      game("CHI", "NYK", { status: "postponed" }),
    ];
    const out = dayMatchups(games, picks, "2026-10-31");
    expect(out.map((m) => `${m.game.homeTeamId}-${m.game.awayTeamId}`).sort()).toEqual(["BOS-MIA", "CHI-NYK", "LAL-DEN"]);
    const chi = out.find((m) => m.game.homeTeamId === "CHI")!;
    expect(chi.homePick.playerId).toBe("a");
    expect(chi.awayPick.playerId).toBe("b");
  });

  it("orders live games first, then upcoming by tipoff, then finished", () => {
    const at = (h: number) => new Date(`2026-10-31T${String(h).padStart(2, "0")}:00:00Z`);
    const games = [
      game("CHI", "NYK", { status: "final", tipoffAt: at(17) }),
      game("BOS", "MIA", { status: "scheduled", tipoffAt: at(23) }),
      game("NYK", "CHI", { status: "scheduled", tipoffAt: at(20) }),
      game("MIA", "BOS", { status: "in_progress", tipoffAt: at(19) }),
      game("LAL", "NYK", { status: "scheduled", tipoffAt: null }), // unknown tipoff goes last
    ];
    const order = dayMatchups(games, picks, "2026-10-31").map((m) => `${m.game.homeTeamId}-${m.game.awayTeamId}`);
    expect(order).toEqual(["MIA-BOS", "NYK-CHI", "BOS-MIA", "LAL-NYK", "CHI-NYK"]);
  });

  it("returns nothing for a day without games", () => {
    expect(dayMatchups([game("LAL", "DEN")], picks, "2026-11-02")).toEqual([]);
  });
});

describe("finalOutcome", () => {
  const s = (ownerId: string, side: "W" | "L", score: number) => ({ ownerId, side, score });
  const sum = (r: ReturnType<typeof finalOutcome>) => r?.map((x) => `${x.who.ownerId}+${x.points}`).join(" ");

  it("gives +1 to the head-to-head winner", () => {
    expect(sum(finalOutcome(s("a", "W", 110), s("b", "W", 102)))).toBe("a+1");
    expect(sum(finalOutcome(s("a", "L", 110), s("b", "L", 102)))).toBe("b+1");
  });
  it("gives +1 to both players, or to nobody, when their picks pay off together", () => {
    expect(sum(finalOutcome(s("a", "W", 110), s("b", "L", 102)))).toBe("a+1 b+1");
    expect(sum(finalOutcome(s("a", "W", 98), s("b", "L", 102)))).toBe("");
  });
  it("gives one owner +2, +1 or +0 for both teams", () => {
    expect(sum(finalOutcome(s("a", "W", 110), s("a", "L", 102)))).toBe("a+2");
    expect(sum(finalOutcome(s("a", "W", 98), s("a", "L", 102)))).toBe("a+0");
    expect(sum(finalOutcome(s("a", "W", 110), s("a", "W", 102)))).toBe("a+1");
  });
  it("is null for a tie", () => {
    expect(finalOutcome(s("a", "W", 100), s("b", "W", 100))).toBeNull();
  });
});
