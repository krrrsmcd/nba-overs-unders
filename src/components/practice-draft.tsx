"use client";

import { useMemo, useState } from "react";
import { DraftBoard, type TakenInfo } from "@/components/draft-board";
import { SoundToggle } from "@/components/pick-sound";
import { Panel, SectionBar, buttonClass, smallButtonClass } from "@/components/ui";
import { NBA_TEAMS } from "@/db/teams";
import { positionForPick, roundOf, TOTAL_PICKS } from "@/lib/draft";

type PracticePick = { pickNumber: number; seat: number; teamId: string; side: "W" | "L" };

const BOARD_TEAMS = [...NBA_TEAMS].sort(
  (a, b) => b.winTotals.betmgm - a.winTotals.betmgm || a.id.localeCompare(b.id),
);
const TEAM_BY_ID = new Map(NBA_TEAMS.map((t) => [t.id, t]));
const PRACTICE_ID = "practice";

/** A full mock draft that lives only in this browser: you make every seat's pick. */
export function PracticeDraft() {
  const [size, setSize] = useState<number | null>(null);
  const [picks, setPicks] = useState<PracticePick[]>([]);

  const seats = useMemo(() => Array.from({ length: size ?? 0 }, (_, i) => `Seat ${i + 1}`), [size]);

  if (!size) {
    return (
      <Panel className="flex flex-col gap-4">
        <p className="text-ink-dim">
          Run a mock snake draft with the real board, pick dialog and announcer. You make every seat&apos;s pick.
          Nothing is saved.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[2, 3, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setPicks([]);
                setSize(n);
              }}
              className="flex flex-col items-center gap-1 border-4 border-ink bg-bg px-2 py-3 text-ink shadow-[3px_3px_0_0_#000] hover:border-yellow"
            >
              <span className="font-display text-3xl leading-none">{n}P</span>
              <span className="text-xs font-medium">{30 / n} picks each</span>
            </button>
          ))}
        </div>
      </Panel>
    );
  }

  const n = picks.length;
  const done = n >= TOTAL_PICKS;
  const seat = positionForPick(n, size);
  const taken: Record<string, TakenInfo> = {};
  for (const p of picks) taken[p.teamId] = { side: p.side, owner: seats[p.seat], pickNumber: p.pickNumber };

  async function onPick(teamId: string, side: "W" | "L") {
    if (taken[teamId]) return { error: "That team is already taken." };
    setPicks((ps) => [...ps, { pickNumber: ps.length + 1, seat: positionForPick(ps.length, size!), teamId, side }]);
    return { ok: true };
  }

  return (
    <>
      <section className={`pixel-border flex flex-col gap-3 p-4 ${done ? "bg-panel" : "bg-yellow text-bg"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-pixel text-[10px]">
            {done ? "DRAFT COMPLETE" : `ROUND ${roundOf(n, size) + 1} · PICK ${n + 1} OF ${TOTAL_PICKS}`}
          </p>
          <span className="flex gap-2">
            <SoundToggle />
            <button type="button" className={smallButtonClass} onClick={() => setPicks((ps) => ps.slice(0, -1))} disabled={n === 0}>
              UNDO
            </button>
            <button type="button" className={smallButtonClass} onClick={() => setSize(null)}>
              RESET
            </button>
          </span>
        </div>
        {!done && <p className="font-display text-3xl leading-none sm:text-4xl">{seats[seat].toUpperCase()}: YOUR PICK!</p>}
      </section>

      {!done && (
        <section>
          <SectionBar>PICK A TEAM</SectionBar>
          <DraftBoard
            leagueId={PRACTICE_ID}
            teams={BOARD_TEAMS}
            taken={taken}
            myTurn
            nextPickNumber={n + 1}
            onPick={onPick}
          />
        </section>
      )}

      <section>
        <SectionBar color="cyan">ROSTERS</SectionBar>
        <div className="grid gap-3 sm:grid-cols-2">
          {seats.map((name, i) => (
            <Panel key={name} className={!done && i === seat ? "border-yellow" : ""}>
              <p className="mb-3 font-display text-lg">{name}</p>
              <ul className="flex flex-col gap-1.5">
                {picks
                  .filter((p) => p.seat === i)
                  .map((p) => {
                    const t = TEAM_BY_ID.get(p.teamId)!;
                    return (
                      <li key={p.pickNumber} className="flex items-center gap-2 text-sm">
                        <span className="font-pixel w-11 shrink-0 px-1 py-0.5 text-center text-[9px] text-white" style={{ background: t.primaryColor }}>
                          {t.id}
                        </span>
                        <span className="min-w-0 flex-1 break-words">
                          {t.city} {t.name}
                        </span>
                        <span className={`font-pixel text-[9px] ${p.side === "W" ? "text-win" : "text-loss"}`}>
                          {p.side === "W" ? "WINS" : "LOSSES"}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </Panel>
          ))}
        </div>
      </section>

      {done && (
        <div className="flex justify-center">
          <button type="button" className={buttonClass} onClick={() => setSize(null)}>
            ▶ RUN IT BACK
          </button>
        </div>
      )}
    </>
  );
}
