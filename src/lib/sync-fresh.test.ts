import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let lastSyncedAt: Date | null = null;
vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: async () => [{ lastSyncedAt }] }) }),
  }),
  schema: { syncState: { id: "id" } },
}));

const { MANUAL_REFRESH_MIN_MS, syncScores } = await import("./sync");

describe("syncScores freshness", () => {
  const now = new Date("2026-10-31T20:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const key = process.env.BALLDONTLIE_API_KEY;
  afterEach(() => {
    process.env.BALLDONTLIE_API_KEY = key;
  });

  it("skips page-load syncs within 10 minutes", async () => {
    lastSyncedAt = ago(5 * 60 * 1000);
    expect(await syncScores(now)).toBe("fresh");
  });

  it("lets a manual refresh pull once the last sync is over a minute old", async () => {
    delete process.env.BALLDONTLIE_API_KEY; // stops right after the freshness check
    lastSyncedAt = ago(5 * 60 * 1000);
    expect(await syncScores(now, { minAgeMs: MANUAL_REFRESH_MIN_MS })).toBe("error");
  });

  it("still holds a manual refresh to one pull per minute", async () => {
    lastSyncedAt = ago(30 * 1000);
    expect(await syncScores(now, { minAgeMs: MANUAL_REFRESH_MIN_MS })).toBe("fresh");
  });
});
