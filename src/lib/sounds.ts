/** Announcer clips played after a draft pick (custom ElevenLabs recordings in /public/sounds). */

import { GAMES_PER_TEAM, NBA_TEAMS } from "@/db/teams";

export const GOOD_PICK_SOUNDS = [
  "/sounds/good/hell-yeah-brother.mp3",
  "/sounds/good/kaboom-shakalaka.mp3",
  "/sounds/good/nice-pick.mp3",
  "/sounds/good/oh-f-yeah.mp3",
  "/sounds/good/oh-great-pick-great-pick.mp3",
  "/sounds/good/oh-mama.mp3",
  "/sounds/good/oh-somebody-did-their-homework.mp3",
  "/sounds/good/somebody-did-their-homework.mp3",
  "/sounds/good/thats-not-a-pick-thats-a-prophecy.mp3",
];

export const BAD_PICK_SOUNDS = [
  "/sounds/bad/a-swing-and-a-miss.mp3",
  "/sounds/bad/and-the-crowd-goes-mild.mp3",
  "/sounds/bad/bold-strategy-cotton.mp3",
  "/sounds/bad/even-the-mascot-wants-a-trade.mp3",
  "/sounds/bad/more-like-a-cry-for-help.mp3",
  "/sounds/bad/send-them-straight-to-galveston.mp3",
  "/sounds/bad/that-teams-ceiling-is-the-floor.mp3",
];

/** Team-specific clips that always play when that team is drafted. */
export const TEAM_SOUNDS: Record<string, string> = {
  DEN: "/sounds/special/most-beautiful-man-in-all-of-serbia.mp3",
};

const BETMGM = new Map(NBA_TEAMS.map((t) => [t.id, t.winTotals.betmgm]));

/**
 * A pick is "good" when the side taken is projected to score at least half the season:
 * Wins on a team with a BetMGM total of 41+, or Losses on a team below 41.
 */
export function isGoodPick(teamId: string, side: "W" | "L"): boolean {
  const wins = BETMGM.get(teamId) ?? GAMES_PER_TEAM / 2;
  const projected = side === "W" ? wins : GAMES_PER_TEAM - wins;
  return projected >= GAMES_PER_TEAM / 2;
}

/** The clip for a pick: the team's own clip if it has one, else a random good/bad clip (no immediate repeats). */
export function soundForPick(teamId: string, side: "W" | "L", last?: string, random = Math.random): string {
  if (TEAM_SOUNDS[teamId]) return TEAM_SOUNDS[teamId];
  const pool = isGoodPick(teamId, side) ? GOOD_PICK_SOUNDS : BAD_PICK_SOUNDS;
  const choices = pool.filter((s) => s !== last);
  return choices[Math.floor(random() * choices.length)];
}

/** Clips for tapping a hot-streak flame on a Wins pick (the team keeps winning). */
export const WIN_STREAK_SOUNDS = [
  "/sounds/streak-win/book-the-parade-fam.mp3",
  "/sounds/streak-win/hotter-than-a-whore-in-church.mp3",
  "/sounds/streak-win/oh-theyre-on-fire.mp3",
  "/sounds/streak-win/too-hot-to-handle.mp3",
  "/sounds/streak-win/turn-on-the-sprinklers.mp3",
];

/** Clips for tapping a hot-streak flame on a Losses pick (the team keeps losing). */
export const LOSS_STREAK_SOUNDS = [
  "/sounds/streak-loss/another-l-keep-em-coming.mp3",
  "/sounds/streak-loss/brick-city-population-them.mp3",
  "/sounds/streak-loss/first-apron-second-apron.mp3",
  "/sounds/streak-loss/the-tank-is-full-baby.mp3",
  "/sounds/streak-loss/they-cant-buy-a-bucket.mp3",
];

/** A random streak clip for the pick's side (no immediate repeats). */
export function soundForStreak(side: "W" | "L", last?: string, random = Math.random): string {
  const pool = side === "W" ? WIN_STREAK_SOUNDS : LOSS_STREAK_SOUNDS;
  const choices = pool.filter((s) => s !== last);
  return choices[Math.floor(random() * choices.length)];
}
