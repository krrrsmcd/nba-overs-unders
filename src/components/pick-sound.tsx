"use client";

import { useEffect, useSyncExternalStore } from "react";
import { soundForPick } from "@/lib/sounds";
import { smallButtonClass } from "@/components/ui";

const MUTE_KEY = "ou_sound_muted";
const heardKey = (leagueId: string) => `ou_heard_pick_${leagueId}`;
let lastClip: string | undefined;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: sound still works, preferences just don't persist */
  }
}

const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const isMuted = () => read(MUTE_KEY) === "1";

/** Play the announcer clip for a pick. Call from the click that makes the pick so browsers allow audio. */
export function playPickSound(teamId: string, side: "W" | "L"): HTMLAudioElement | null {
  if (isMuted()) return null;
  const clip = soundForPick(teamId, side, lastClip);
  lastClip = clip;
  const audio = new Audio(clip);
  audio.play().catch(() => {
    /* autoplay blocked or file missing: stay silent */
  });
  return audio;
}

/** Remember that this browser already announced a pick, so the board doesn't replay it. */
export function markPickHeard(leagueId: string, pickNumber: number) {
  write(heardKey(leagueId), String(pickNumber));
}

/** Plays the newest pick's clip when it arrives on refresh (e.g. another player picked). */
export function PickAnnouncer({
  leagueId,
  pickNumber,
  teamId,
  side,
}: {
  leagueId: string;
  pickNumber: number;
  teamId: string;
  side: "W" | "L";
}) {
  useEffect(() => {
    const stored = read(heardKey(leagueId));
    markPickHeard(leagueId, pickNumber);
    // First visit (nothing stored) or nothing new: don't play. Pick 0 = draft not started yet.
    if (pickNumber === 0 || stored === null || pickNumber <= Number(stored)) return;
    playPickSound(teamId, side);
  }, [leagueId, pickNumber, teamId, side]);
  return null;
}

export function SoundToggle() {
  const muted = useSyncExternalStore(subscribe, isMuted, () => false);
  return (
    <button
      type="button"
      className={smallButtonClass}
      aria-pressed={!muted}
      onClick={() => {
        write(MUTE_KEY, muted ? "0" : "1");
        listeners.forEach((fn) => fn());
      }}
    >
      {muted ? "SOUND: OFF" : "SOUND: ON"}
    </button>
  );
}
