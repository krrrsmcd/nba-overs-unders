import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({}), schema: {} }));

const { addDays, easternDate, gameCounts } = await import("./sync");

describe("gameCounts", () => {
  const base = { postseason: false, ist_stage: null, date: "2026-11-01" };
  it("counts regular-season and NBA Cup group/knockout games", () => {
    expect(gameCounts(base)).toBe(true);
    expect(gameCounts({ ...base, ist_stage: "West Group A" })).toBe(true);
    expect(gameCounts({ ...base, ist_stage: "East Semifinal" })).toBe(true);
  });
  it("excludes the NBA Cup final, playoffs, play-in and preseason", () => {
    expect(gameCounts({ ...base, ist_stage: "Championship" })).toBe(false);
    expect(gameCounts({ ...base, postseason: true })).toBe(false);
    expect(gameCounts({ ...base, date: "2027-04-15" })).toBe(false); // play-in week
    expect(gameCounts({ ...base, date: "2026-10-15" })).toBe(false); // preseason
  });
});

describe("dates", () => {
  it("uses the US Eastern calendar day", () => {
    // 03:30 UTC on Oct 21 is still Oct 20 in New York.
    expect(easternDate(new Date("2026-10-21T03:30:00Z"))).toBe("2026-10-20");
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });
});
