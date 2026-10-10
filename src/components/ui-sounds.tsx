"use client";

import { useEffect } from "react";
import { isSoundMuted } from "@/components/pick-sound";

/**
 * Tiny synthesized 8-bit blips for hovering and clicking buttons. No audio files:
 * square-wave tones from the Web Audio API, quiet, and silent when sound is off.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freqs: number[], stepMs: number, volume: number) {
  const ac = audio();
  if (!ac || ac.state !== "running" || isSoundMuted()) return;
  const start = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  freqs.forEach((f, i) => osc.frequency.setValueAtTime(f, start + (i * stepMs) / 1000));
  const end = start + (freqs.length * stepMs) / 1000;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(end + 0.01);
}

export const playHoverBlip = () => tone([1320], 28, 0.03);
export const playClickBlip = () => tone([660, 990], 45, 0.05);

const INTERACTIVE = 'button, a[href], summary, [role="button"], [role="radio"]';

function target(e: Event): HTMLElement | null {
  const el = (e.target as Element | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
  if (!el || el.matches(":disabled, [aria-disabled='true']")) return null;
  return el;
}

/** Mount once (in the root layout) to add hover and click blips to every button and link. */
export function UiSounds() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const ac = audio();
      // Browsers only allow audio after a user gesture; the first press unlocks it.
      if (ac && ac.state === "suspended") ac.resume().then(() => target(e) && playClickBlip());
      else if (target(e)) playClickBlip();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // no hover sounds on touch screens
      const el = target(e);
      if (!el) return;
      const from = (e.relatedTarget as Element | null)?.closest?.(INTERACTIVE);
      if (from === el) return; // moving within the same button
      playHoverBlip();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && target(e)) playClickBlip();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);
  return null;
}
