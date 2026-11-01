"use client";

import { useState, useSyncExternalStore } from "react";
import { Flame } from "@/components/pixel-art";
import { RaceChart, type RaceLine } from "@/components/race-chart";
import { Panel } from "@/components/ui";
import { finalOutcome } from "@/lib/matchups";

export type MatchupSide = {
  teamId: string;
  teamName: string;
  teamColor: string;
  record: string;
  score: number;
  ownerId: string;
  ownerName: string;
  ownerColor: string;
  side: "W" | "L";
};

export type MatchupRow = {
  key: string;
  status: "scheduled" | "in_progress" | "final";
  /** ISO timestamp; formatted in the viewer's time zone. */
  tipoffAt: string | null;
  /** Quarter and clock while live, e.g. "Q3 3:44"; null when unknown. */
  liveClock: string | null;
  away: MatchupSide;
  home: MatchupSide;
};

export type MatchupDay = { label: "YESTERDAY" | "TODAY" | "TOMORROW"; date: string; rows: MatchupRow[] };

type Tab = "matchups" | "history";

/** Matchups and History share one panel; Matchups shows first. */
export function MatchupsHistoryPanel({
  days,
  race,
  heater,
}: {
  days: MatchupDay[];
  race: { dates: string[]; lines: RaceLine[] };
  /** Biggest points gain over the last 7 days, shown as the History chart's headline. */
  heater: { name: string; color: string; gain: number } | null;
}) {
  const [tab, setTab] = useState<Tab>("matchups");
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, days.findIndex((d) => d.label === "TODAY")));
  const day = days[dayIndex];

  return (
    <section>
      <div role="tablist" aria-label="Matchups and history" className="mb-4 flex gap-2">
        <TabButton active={tab === "matchups"} onClick={() => setTab("matchups")}>
          MATCHUPS
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
              NO MATCHUPS {day.label}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {day.rows.map((m) => (
                <MatchupCard key={m.key} m={m} />
              ))}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel className="flex flex-col gap-4">
          {heater && (
            <div className="flex items-center gap-3 border-b-2 border-white pb-4">
              {/* Flame + "LAST 7 DAYS", with the name on its own line below. */}
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <span className="font-pixel flex items-center gap-1.5 text-[9px] leading-relaxed text-white">
                  <Flame size={12} />
                  LAST 7 DAYS
                </span>
                <span
                  className="min-w-0 max-w-full font-display text-lg leading-tight break-words"
                  style={{ color: heater.color }}
                >
                  {heater.name}
                </span>
              </div>
              <span className="font-display text-2xl" style={{ color: heater.color }}>
                +{heater.gain}
              </span>
            </div>
          )}
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
    <li className="border-2 border-bg bg-panel-2 px-3 pt-2.5 pb-2">
      <div className="flex flex-col gap-1.5">
        <TeamLine s={m.away} showScore={m.status !== "scheduled"} dim={winner === "home"} />
        <TeamLine s={m.home} showScore={m.status !== "scheduled"} dim={winner === "away"} />
      </div>
      <div className="mt-2.5 flex justify-center">
        {m.status === "in_progress" ? (
          <span className="font-pixel flex items-center gap-1.5 text-[8px] text-white">
            <span aria-hidden className="blink inline-block h-1.5 w-1.5 rounded-full bg-magenta" />
            {/* The dot marks it live; the word only shows when the clock isn't known yet. */}
            {m.liveClock ? (
              <>
                <span className="sr-only">Live, </span>
                {m.liveClock}
              </>
            ) : (
              "LIVE"
            )}
          </span>
        ) : final ? (
          <FinalStatus m={m} />
        ) : (
          <span className="font-pixel text-[8px] text-ink-dim">
            {m.tipoffAt ? <TipoffTime iso={m.tipoffAt} /> : "TBD"}
          </span>
        )}
      </div>
    </li>
  );
}

/** "FINAL • AIR BALLERS +1 • BRICK CITY +1", or "FINAL • NO POINTS". Wraps on narrow cards. */
function FinalStatus({ m }: { m: MatchupRow }) {
  const outcome = finalOutcome(m.home, m.away);
  const dot = (
    <span aria-hidden className="shrink-0">
      •
    </span>
  );
  return (
    <span className="font-pixel flex min-w-0 flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[8px] leading-relaxed text-ink-dim">
      <span className="shrink-0">FINAL</span>
      {outcome && outcome.length === 0 && (
        <>
          {dot}
          <span className="shrink-0">NO POINTS</span>
        </>
      )}
      {outcome?.map(({ who, points }) => (
        <span key={who.ownerId} className="flex min-w-0 items-center gap-1.5">
          {dot}
          <span className="uppercase" style={{ color: who.ownerColor }}>
            {who.ownerName} +{points}
          </span>
        </span>
      ))}
    </span>
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

const noSubscribe = () => () => {};

/**
 * Tipoff in the viewer's own time zone. The server renders in UTC, so the time is only
 * formatted once hydrated in the browser; until then a blank keeps the footer's height.
 */
function TipoffTime({ iso }: { iso: string }) {
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!inBrowser) return <>&nbsp;</>;
  return <>{new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>;
}
