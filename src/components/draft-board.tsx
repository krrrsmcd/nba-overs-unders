"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { makePick, type FormState } from "@/app/actions";
import { Modal } from "@/components/modal";
import { markPickHeard, playPickSound } from "@/components/pick-sound";
import { buttonClass, smallButtonClass } from "@/components/ui";
import { WIN_TOTAL_SOURCES, type TeamSeed } from "@/db/teams";

export type TakenInfo = { side: "W" | "L"; owner: string; pickNumber: number };

/** Re-fetches the page every `everyMs` while the tab is visible (e.g. waiting for another player's pick). */
export function AutoRefresh({ everyMs = 20_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return null;
}

/** Refreshes server data when the tab regains focus, plus a manual button. */
export function RefreshControls() {
  const router = useRouter();
  const [pending, start] = useTransition();
  useEffect(() => {
    const onFocus = () => start(() => router.refresh());
    const onVisible = () => document.visibilityState === "visible" && onFocus();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);
  return (
    <button type="button" className={smallButtonClass} disabled={pending} onClick={() => start(() => router.refresh())}>
      {pending ? "…" : "↻ REFRESH"}
    </button>
  );
}

export function DraftBoard({
  leagueId,
  teams,
  taken,
  myTurn,
  nextPickNumber,
  onPick,
}: {
  leagueId: string;
  /** Overrides the server pick (used by the practice draft). */
  onPick?: (teamId: string, side: "W" | "L") => Promise<FormState>;
  teams: TeamSeed[];
  taken: Record<string, TakenInfo>;
  myTurn: boolean;
  nextPickNumber: number;
}) {
  const [selected, setSelected] = useState<TeamSeed | null>(null);
  const [side, setSide] = useState<"W" | "L" | null>(null);
  const [error, setError] = useState<string>();
  const [stamp, setStamp] = useState<string>();
  const [pending, start] = useTransition();

  function close() {
    setSelected(null);
    setSide(null);
    setError(undefined);
  }

  return (
    <>
      {stamp && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <p className="font-display stamp -rotate-6 border-8 border-yellow bg-bg/90 px-6 py-4 text-4xl text-yellow shadow-[6px_6px_0_0_#000] sm:text-6xl">
            LOCKED IN!
          </p>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {teams.map((t) => {
          const tk = taken[t.id];
          const canPick = myTurn && !tk;
          return (
            <li key={t.id}>
              <button
                type="button"
                disabled={!canPick}
                onClick={() => setSelected(t)}
                aria-label={tk ? `${t.city} ${t.name}, taken by ${tk.owner}` : `${t.city} ${t.name}`}
                className={`pixel-border relative flex h-full w-full flex-col items-start gap-1 p-3 text-left ${
                  tk ? "opacity-35 grayscale" : canPick ? "hover:-translate-y-0.5 hover:border-yellow" : ""
                } disabled:cursor-default`}
                style={{
                  background: `linear-gradient(135deg, ${t.primaryColor} 0%, ${t.primaryColor} 72%, ${t.secondaryColor} 72%)`,
                }}
              >
                <span className="font-pixel text-sm text-white [text-shadow:2px_2px_0_#000]">{t.id}</span>
                <span className="text-xs font-medium text-white [text-shadow:1px_1px_0_#000]">
                  {t.city} {t.name}
                </span>
                <span className="mt-auto flex items-baseline gap-1 whitespace-nowrap bg-black/60 px-1.5 py-0.5 text-white">
                  <span className="font-pixel text-[7px] opacity-80">BETMGM O/U</span>
                  <span className="text-xs font-semibold tabular-nums">{t.winTotals.betmgm}</span>
                </span>
                {tk && (
                  <span className="font-pixel mt-1 bg-black/80 px-1 py-0.5 text-[8px] leading-tight text-white">
                    #{tk.pickNumber} {tk.owner} · {tk.side === "W" ? "WINS" : "LOSSES"}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <Modal title={side ? "CONFIRM PICK" : "PICK A SIDE"} onClose={close} locked={pending}>
          <div className="flex flex-col gap-4">
            <div
              className="pixel-border p-3"
              style={{
                background: `linear-gradient(135deg, ${selected.primaryColor} 0%, ${selected.primaryColor} 72%, ${selected.secondaryColor} 72%)`,
              }}
            >
              <p className="font-display text-2xl text-white [text-shadow:2px_2px_0_#000]">
                {selected.city} {selected.name}
              </p>
              <p className="font-pixel mt-2 text-[8px] text-white/80 [text-shadow:1px_1px_0_#000]">WIN TOTALS (O/U)</p>
              <dl className="mt-1 inline-grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 bg-black/60 px-2 py-1.5 text-sm text-white">
                {WIN_TOTAL_SOURCES.map((src) => (
                  <div key={src.book} className="contents">
                    <dt>{src.name}</dt>
                    <dd className="text-right font-semibold tabular-nums">{selected.winTotals[src.book]}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {!side ? (
              <>
                <p className="text-sm text-ink-dim">Score a point for every…</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSide("W")}
                    className="font-display border-4 border-win bg-bg py-4 text-2xl text-win shadow-[4px_4px_0_0_#000] hover:bg-win hover:text-bg"
                  >
                    WINS
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide("L")}
                    className="font-display border-4 border-loss bg-bg py-4 text-2xl text-loss shadow-[4px_4px_0_0_#000] hover:bg-loss hover:text-bg"
                  >
                    LOSSES
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" className={smallButtonClass} onClick={close}>
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  Draft the {selected.city} {selected.name} for{" "}
                  <span className={`font-semibold ${side === "W" ? "text-win" : "text-loss"}`}>
                    {side === "W" ? "WINS" : "LOSSES"}
                  </span>
                  ?
                </p>
                <p className="font-pixel text-[10px] text-magenta">THIS IS FINAL.</p>
                {error && <p className="font-pixel text-[10px] leading-relaxed text-magenta">{error}</p>}
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" className={smallButtonClass} disabled={pending} onClick={() => setSide(null)}>
                    BACK
                  </button>
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        // Start the clip inside the click so browsers allow it; stop it if the pick fails.
                        const audio = playPickSound(selected.id, side);
                        markPickHeard(leagueId, nextPickNumber);
                        const res = await (onPick ? onPick(selected.id, side) : makePick(leagueId, selected.id, side));
                        if (res?.error) {
                          audio?.pause();
                          markPickHeard(leagueId, nextPickNumber - 1);
                          setError(res.error);
                          return;
                        }
                        close();
                        setStamp(selected.id);
                        setTimeout(() => setStamp(undefined), 1400);
                      })
                    }
                  >
                    {pending ? "LOCKING…" : "▶ LOCK IT IN"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
