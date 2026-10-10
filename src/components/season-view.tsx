import { eq } from "drizzle-orm";
import { after } from "next/server";
import { RefreshControls } from "@/components/draft-board";
import { RenameTeamButton } from "@/components/rename-team";
import { Badge, Panel, SectionBar } from "@/components/ui";
import { getDb, schema } from "@/db";
import { NBA_TEAMS } from "@/db/teams";
import { projectedPickPoints } from "@/lib/projection";
import { raceSeries } from "@/lib/race";
import { leaderboard, teamRecords, type PickRow } from "@/lib/scoring";
import { RaceChart } from "@/components/race-chart";
import { playerColor } from "@/lib/colors";
import { Confetti, Flame, Trophy } from "@/components/pixel-art";
import { biggestMover, HOT_STREAK, isSeasonOver, pickStreak, recentGains, teamStreaks, type DatedScoredGame } from "@/lib/insights";
import { getLeaguePicks, getLeaguePlayers, type League, type Player } from "@/lib/session";
import { currentTime, easternDate, getLastSyncedAt, REGULAR_SEASON_END, REGULAR_SEASON_START, syncScores } from "@/lib/sync";

const TEAM_BY_ID = new Map(NBA_TEAMS.map((t) => [t.id, t]));
const SYNC_WAIT_MS = 3000;

function ordinal(n: number) {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function ago(at: Date | null) {
  if (!at) return "not yet";
  const min = Math.round((Date.now() - at.getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} days ago`;
}

/** Season standings for a league whose draft is complete. */
export async function SeasonView({ league, me }: { league: League; me: Player }) {
  // Refresh scores (at most every 10 min), but never hold the page more than 3 s.
  const sync = syncScores().catch((err) => {
    console.error("[sync]", err);
    return "error" as const;
  });
  after(() => sync);
  await Promise.race([sync, new Promise((r) => setTimeout(r, SYNC_WAIT_MS))]);

  const [players, picks, games, syncedAt] = await Promise.all([
    getLeaguePlayers(league.id),
    getLeaguePicks(league.id),
    getDb().select().from(schema.games).where(eq(schema.games.counts, true)),
    getLastSyncedAt(),
  ]);
  return (
    <SeasonBoard
      league={league}
      me={me}
      players={players}
      picks={picks}
      games={games.map((g) => ({ ...g, gameDate: String(g.gameDate) }))}
      syncedLabel={`Scores updated ${ago(syncedAt)}`}
      today={easternDate(currentTime())}
    />
  );
}

export type SeasonBoardProps = {
  league: { id: string; name: string; size: number };
  me: { id: string; teamName: string | null };
  players: { id: string; teamName: string | null; draftPosition: number | null }[];
  picks: PickRow[];
  games: DatedScoredGame[];
  syncedLabel: string;
  /** US Eastern date the board is shown for (decides whether the season is over). */
  today: string;
  /** Demo mode: no refresh or rename controls. */
  demo?: boolean;
};

/** The season scoreboard itself, from already-loaded data (also used by the demo page). */
export function SeasonBoard({ league, me, players, picks, games, syncedLabel, today, demo = false }: SeasonBoardProps) {
  const dated = games;
  const records = teamRecords(games);
  const streaks = teamStreaks(dated);
  const rows = leaderboard(players, picks, records).map((r) => {
    const picksWithProj = r.picks.map((pk) => ({
      ...pk,
      projected: projectedPickPoints(pk.side, pk.record, TEAM_BY_ID.get(pk.nbaTeamId)!.winTotals.betmgm),
      streak: pickStreak(pk.side, streaks.get(pk.nbaTeamId)),
    }));
    return {
      ...r,
      picks: picksWithProj,
      projected: picksWithProj.reduce((sum, pk) => sum + pk.projected, 0),
      hot: picksWithProj.filter((pk) => pk.streak >= HOT_STREAK).length,
    };
  });
  const byDraft = [...players].sort((a, b) => (a.draftPosition ?? 0) - (b.draftPosition ?? 0));
  const race = raceSeries(
    dated,
    picks,
    byDraft.map((p) => p.id),
  );
  const raceLines = byDraft.map((p, i) => ({
    id: p.id,
    name: p.teamName ?? "Unnamed",
    isMe: p.id === me.id,
    values: race.series[i].values,
  }));
  const colorOf = new Map(byDraft.map((p, i) => [p.id, playerColor(i)]));
  const started = games.some((g) => g.status === "final");
  const over = isSeasonOver(today, REGULAR_SEASON_END, dated);
  const champions = over ? rows.filter((r) => r.rank === 1) : [];
  const mover = started && !over ? biggestMover(recentGains(race.dates, race.series)) : null;
  const moverName = mover && players.find((p) => p.id === mover.playerId)?.teamName;
  const tied = (rank: number) => rows.filter((r) => r.rank === rank).length > 1;

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-[10px] text-cyan">{league.size}-PLAYER LEAGUE · 2026–27 SEASON</p>
        <h1 className="arcade-title text-4xl leading-tight sm:text-5xl">{league.name}</h1>
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-dim">{syncedLabel}</p>
        {!demo && <RefreshControls />}
      </div>

      {!started && (
        <Panel className="text-center">
          <p className="font-pixel text-[10px] leading-relaxed text-yellow">
            SEASON TIPS OFF {new Date(`${REGULAR_SEASON_START}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}. EVERYONE STARTS AT 0.
          </p>
        </Panel>
      )}

      {over && champions.length > 0 && (
        <section className="pixel-border relative flex flex-col items-center gap-3 overflow-hidden bg-panel px-4 py-8 text-center">
          <Confetti />
          <p className="font-pixel text-[10px] text-cyan">2026–27 REGULAR SEASON · FINAL</p>
          <Trophy size={112} />
          <p className="font-pixel blink text-xs text-yellow">{champions.length > 1 ? "CO-CHAMPIONS" : "CHAMPION"}</p>
          {champions.map((c) => (
            <p key={c.playerId} className="arcade-title text-4xl leading-tight break-words sm:text-5xl">
              {c.teamName}
            </p>
          ))}
          <p className="font-display text-2xl text-ink">{champions[0].points} POINTS</p>
        </section>
      )}

      <section>
        <SectionBar color="yellow">{over ? "FINAL STANDINGS" : "SCOREBOARD"}</SectionBar>
        <ol className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.playerId}>
              <details
                className="pixel-border group border-l-8 bg-panel open:bg-panel-2"
                style={{ borderLeftColor: colorOf.get(r.playerId) }}
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span
                    className={`font-pixel w-14 shrink-0 text-xs ${r.rank === 1 ? "text-yellow" : "text-ink-dim"}`}
                  >
                    {tied(r.rank) ? "T-" : ""}
                    {ordinal(r.rank)}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 font-display text-lg leading-tight break-words">{r.teamName}</span>
                    {r.playerId === me.id && <Badge tone="cyan">YOU</Badge>}
                    {r.hot > 0 && !over && (
                      <span className="flex items-center gap-0.5 text-xs text-orange" title={`${r.hot} pick(s) on a hot streak`}>
                        <Flame size={12} />
                        <span className="font-pixel text-[9px]">{r.hot}</span>
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-end leading-none">
                    <span className="font-display text-3xl tabular-nums" style={{ color: colorOf.get(r.playerId) }}>
                      {r.points}
                    </span>
                    {!over && (
                      <span className="mt-1 text-[11px] tabular-nums text-ink-dim">
                        <span className="font-pixel text-[7px]">PROJ</span> {Math.round(r.projected)}
                      </span>
                    )}
                  </span>
                  <span aria-hidden className="w-3 text-center text-sm text-ink-dim">
                    <span className="group-open:hidden">▸</span>
                    <span className="hidden group-open:inline">▾</span>
                  </span>
                </summary>
                <ul className="flex flex-col gap-2 border-t-2 border-bg px-3 pt-3 pb-4 sm:px-4">
                  <li className="font-pixel flex items-center gap-1.5 text-[8px] text-ink-dim" aria-hidden>
                    <span className="flex-1">TEAM</span>
                    <span className="w-7 text-center">PICK</span>
                    <span className="w-10 text-right">W–L</span>
                    <span className="w-7 text-right">PTS</span>
                    {!over && <span className="w-8 text-right">PROJ</span>}
                  </li>
                  {r.picks.map((pk) => {
                    const t = TEAM_BY_ID.get(pk.nbaTeamId)!;
                    return (
                      <li key={pk.nbaTeamId} className="flex items-center gap-1.5 text-[13px] leading-tight">
                        <span
                          className="font-pixel w-10 shrink-0 px-0.5 py-0.5 text-center text-[9px] text-white"
                          style={{ background: t.primaryColor }}
                        >
                          {t.id}
                        </span>
                        <span className="min-w-0 flex-1 break-words">
                          {t.city} {t.name}
                          {!over && pk.streak >= HOT_STREAK && (
                            <span className="ml-1 inline-flex items-center gap-0.5 align-middle text-orange" title={`Scored ${pk.streak} games in a row`}>
                              <Flame size={11} />
                              <span className="font-pixel text-[8px]">×{pk.streak}</span>
                            </span>
                          )}
                        </span>
                        <span
                          className={`font-pixel w-7 text-center text-[10px] ${pk.side === "W" ? "text-win" : "text-loss"}`}
                          title={pk.side === "W" ? "Wins" : "Losses"}
                        >
                          {pk.side}
                        </span>
                        <span className="w-10 text-right text-xs tabular-nums text-ink-dim">
                          {pk.record.wins}–{pk.record.losses}
                        </span>
                        <span className="w-7 text-right font-semibold tabular-nums">{pk.points}</span>
                        {!over && (
                          <span className="w-8 text-right text-xs tabular-nums text-ink-dim">
                            {Math.round(pk.projected)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {r.playerId === me.id && !demo && (
                  <div className="flex justify-end px-3 pb-4 sm:px-4">
                    <RenameTeamButton leagueId={league.id} current={me.teamName} />
                  </div>
                )}
              </details>
            </li>
          ))}
        </ol>
      </section>

      {mover && moverName && (
        <Panel className="flex items-center gap-3">
          <span className="font-pixel text-[9px] leading-relaxed text-cyan">
            BIGGEST MOVER
            <br />
            LAST 7 DAYS
          </span>
          <span className="min-w-0 flex-1 font-display text-lg leading-tight break-words">{moverName}</span>
          <span className="font-display text-2xl text-win">+{mover.gain}</span>
        </Panel>
      )}

      {race.dates.length > 0 && (
        <section>
          <SectionBar>HISTORY</SectionBar>
          <Panel>
            <RaceChart dates={race.dates} lines={raceLines} />
          </Panel>
        </section>
      )}

    </>
  );
}
