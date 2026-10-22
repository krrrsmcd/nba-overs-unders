import { describe, expect, it } from "vitest";
import {
  BAD_PICK_SOUNDS,
  GOOD_PICK_SOUNDS,
  isGoodPick,
  LOSS_STREAK_SOUNDS,
  soundForPick,
  soundForStreak,
  WIN_STREAK_SOUNDS,
} from "./sounds";

describe("pick sounds", () => {
  it("rates picks by the BetMGM line", () => {
    expect(isGoodPick("OKC", "W")).toBe(true); // 62.5 wins
    expect(isGoodPick("OKC", "L")).toBe(false);
    expect(isGoodPick("SAC", "L")).toBe(true); // 21.5 wins -> 60.5 losses
    expect(isGoodPick("SAC", "W")).toBe(false);
  });

  it("always plays the Serbia clip for the Nuggets", () => {
    expect(soundForPick("DEN", "W")).toMatch(/serbia/);
    expect(soundForPick("DEN", "L")).toMatch(/serbia/);
  });

  it("picks from the right pool and never repeats the last clip", () => {
    for (let i = 0; i < 50; i++) {
      expect(GOOD_PICK_SOUNDS).toContain(soundForPick("BOS", "W"));
      expect(BAD_PICK_SOUNDS).toContain(soundForPick("BOS", "L"));
      expect(soundForPick("BOS", "W", GOOD_PICK_SOUNDS[0], () => 0)).not.toBe(GOOD_PICK_SOUNDS[0]);
    }
  });

  it("plays win-streak clips for Wins picks and loss-streak clips for Losses picks", () => {
    for (let i = 0; i < 50; i++) {
      expect(WIN_STREAK_SOUNDS).toContain(soundForStreak("W"));
      expect(LOSS_STREAK_SOUNDS).toContain(soundForStreak("L"));
    }
    expect(soundForStreak("L", LOSS_STREAK_SOUNDS[0], () => 0)).not.toBe(LOSS_STREAK_SOUNDS[0]);
  });
});
