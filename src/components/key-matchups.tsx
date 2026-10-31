"use client";

import { useState } from "react";
import { RaceChart, type RaceLine } from "@/components/race-chart";
import { Panel } from "@/components/ui";

export type MatchupSide = {
  teamId: string;
  teamName: string;
  teamColor: string;
  record: string;
  score: number;
  ownerName: string;
  ownerColor: string;
  side: "W" | "L";
};

export type MatchupRow = {
  key: string;
  status: "scheduled" | "in_progress" | "final";
  /** ISO timestamp; formatted in the viewer's time zone. */
  tipoffAt: string | null;
  away: MatchupSide;
  home: MatchupSide;
};

export type MatchupDay = { label: "YESTERDAY" | "TODAY" | "TOMORROW"; date: string; rows: MatchupRow[] };

type Tab = "matchups" | "history";

/** Key Matchups and History share one panel; Key Matchups shows first. */
export function MatchupsHistoryPanel({
  days,
  race,
}: {
  days: MatchupDay[];
  race: { dates: string[]; lines: RaceLine[] };
}) {
  const [tab, setTab] = useState<Tab>("matchups");
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, days.findIndex((d) => d.label === "TODAY")));
  const day = days[dayIndex];

  return (
    <section>
      <div role="tablist" aria-label="Key matchups and history" className="mb-4 flex gap-2">
        <TabButton active={tab === "matchups"} onClick={() => setTab("matchups")}>
          KEY MATCHUPS
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>
          HISTORY
        </TabButton>
      </div>

      {tab === "matchups" ? (
        <Panel className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Day">
            {days.map((d, i) => (
              <button
                key={d.date}
                type="button"
                onClick={() => setDayIndex(i)}
                aria-pressed={i === dayIndex}
                className={`font-pixel border-2 px-1 py-2 text-[9px] shadow-[2px_2px_0_0_#000] ${
                  i === dayIndex ? "border-cyan bg-cyan text-bg" : "border-ink bg-panel-2 text-ink hover:bg-[#2b2b5a]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-ink-dim">{longDate(day.date)}</p>

          {day.rows.length === 0 ? (
            <p className="font-pixel py-4 text-center text-[10px] leading-relaxed text-ink-dim">
              NO KEY MATCHUPS {day.label}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {day.rows.map((m) => (
                <MatchupCard key={m.key} m={m} />
              ))}
            </ul>
          )}
          <p className="text-center text-[11px] leading-snug text-ink-dim">
            Key matchups are games where the result swings the gap between two players by 2 points.
          </p>
        </Panel>
      ) : (
        <Panel>
          {race.dates.length > 0 ? (
            <RaceChart dates={race.dates} lines={race.lines} />
          ) : (
            <p className="font-pixel py-4 text-center text-[10px] leading-relaxed text-ink-dim">
              HISTORY STARTS AFTER THE FIRST FINAL
            </p>
          )}
        </Panel>
      )}
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`skew-bar px-4 py-2 ${active ? "bg-magenta text-white" : "bg-panel-2 text-ink-dim hover:text-ink"}`}
    >
      <span className="font-pixel text-xs">{children}</span>
    </button>
  );
}

function MatchupCard({ m }: { m: MatchupRow }) {
  const final = m.status === "final";
  const winner = final ? (m.home.score > m.away.score ? "home" : m.away.score > m.home.score ? "away" : null) : null;
  return (
    <li className="border-2 border-bg bg-panel-2 px-3 py-2.5">
      <div className="mb-2 flex justify-end">
        {m.status === "in_progress" ? (
          <span className="font-pixel blink text-[9px] text-cyan">LIVE</span>
        ) : final ? (
          <span className="font-pixel text-[9px] text-ink-dim">FINAL</span>
        ) : (
          <span className="font-pixel text-[9px] text-yellow" suppressHydrationWarning>
            {m.tipoffAt ? tipoffTime(m.tipoffAt) : "TBD"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <TeamLine s={m.away} showScore={m.status !== "scheduled"} dim={winner === "home"} />
        <TeamLine s={m.home} showScore={m.status !== "scheduled"} dim={winner === "away"} />
      </div>
    </li>
  );
}

function TeamLine({ s, showScore, dim }: { s: MatchupSide; showScore: boolean; dim: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-[13px] leading-tight ${dim ? "opacity-60" : ""}`}>
      <span
        className="font-pixel w-10 shrink-0 px-0.5 py-0.5 text-center text-[9px] text-white"
        style={{ background: s.teamColor }}
      >
        {s.teamId}
      </span>
      <span className="min-w-0 flex-1 truncate">
        {s.teamName} <span className="text-xs tabular-nums text-ink-dim">{s.record}</span>
      </span>
      <span className="flex min-w-0 max-w-[45%] items-center gap-1">
        <span className="truncate text-xs" style={{ color: s.ownerColor }}>
          {s.ownerName}
        </span>
        <span
          className={`font-pixel text-[9px] ${s.side === "W" ? "text-win" : "text-loss"}`}
          title={s.side === "W" ? "Wins" : "Losses"}
        >
          {s.side}
        </span>
      </span>
      {showScore && <span className="w-8 text-right font-display text-lg tabular-nums">{s.score}</span>}
    </div>
  );
}

function longDate(d: string) {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function tipoffTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}
