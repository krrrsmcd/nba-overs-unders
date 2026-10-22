"use client";

import { Flame } from "@/components/pixel-art";
import { playStreakSound } from "@/components/pick-sound";

/** A pick's hot-streak flame. Tapping it plays a random announcer clip for the streak's direction. */
export function StreakBadge({ side, streak }: { side: "W" | "L"; streak: number }) {
  return (
    <button
      type="button"
      onClick={() => playStreakSound(side)}
      className="ml-1 inline-flex cursor-pointer items-center gap-0.5 align-middle text-orange"
      title={`Scored ${streak} games in a row`}
      aria-label={`${side === "W" ? "Winning" : "Losing"} streak: ${streak} games. Play announcer.`}
    >
      <Flame size={11} />
      <span className="font-pixel text-[8px]">×{streak}</span>
    </button>
  );
}
