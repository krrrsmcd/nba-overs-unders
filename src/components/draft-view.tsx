import { DraftBoard, RefreshControls, type TakenInfo } from "@/components/draft-board";
import { TeamNameForm } from "@/components/lobby-controls";
import { Badge, Panel, SectionBar } from "@/components/ui";
import { NBA_TEAMS, PROJECTION_SOURCE } from "@/db/teams";
import { positionForPick, roundOf, TOTAL_PICKS } from "@/lib/draft";
import { getLeaguePicks, getLeaguePlayers, type League, type Player } from "@/lib/session";

const TEAM_BY_ID = new Map(NBA_TEAMS.map((t) => [t.id, t]));

/** The draft room (status `drafting`) and the final rosters (status `complete`). */
export async function DraftView({ league, me }: { league: League; me: Player }) {
  const [players, picks] = await Promise.all([getLeaguePlayers(league.id), getLeaguePicks(league.id)]);
  const order = [...players].sort((a, b) => (a.draftPosition ?? 0) - (b.draftPosition ?? 0));
  const byId = new Map(players.map((p) => [p.id, p]));
  const name = (id: string) => byId.get(id)?.teamName ?? "?";

  const n = picks.length;
  const drafting = league.status === "drafting" && n < TOTAL_PICKS;
  const onClock = drafting ? order[positionForPick(n, league.size)] : undefined;
  const myTurn = onClock?.id === me.id;
  const upNext = drafting
    ? Array.from({ length: Math.min(league.size, TOTAL_PICKS - n - 1) }, (_, k) => ({
        pickNumber: n + k + 2,
        player: order[positionForPick(n + k + 1, league.size)],
      }))
    : [];

  const taken: Record<string, TakenInfo> = {};
  for (const p of picks) taken[p.nbaTeamId] = { side: p.side, owner: name(p.playerId), pickNumber: p.pickNumber };

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-[10px] text-cyan">
          {league.size}-PLAYER LEAGUE · {drafting ? "DRAFT" : "DRAFT COMPLETE"}
        </p>
        <h1 className="arcade-title text-4xl leading-tight sm:text-5xl">{league.name}</h1>
      </header>

      {drafting && onClock ? (
        <section
          className={`pixel-border flex flex-col gap-3 p-4 ${myTurn ? "bg-yellow text-bg" : "bg-panel"}`}
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-pixel text-[10px]">
              ROUND {roundOf(n, league.size) + 1} · PICK {n + 1} OF {TOTAL_PICKS}
            </p>
            <RefreshControls />
          </div>
          {myTurn ? (
            <p className="font-display blink text-3xl leading-none sm:text-4xl">YOUR PICK!</p>
          ) : (
            <p className="font-display text-2xl leading-tight sm:text-3xl">
              <span className="text-yellow">{onClock.teamName}</span> is on the clock
            </p>
          )}
          {upNext.length > 0 && (
            <p className={`text-sm ${myTurn ? "text-bg/80" : "text-ink-dim"}`}>
              Up next:{" "}
              {upNext.map((u, i) => (
                <span key={u.pickNumber}>
                  {i > 0 && " → "}
                  {u.player.id === me.id ? <strong>You</strong> : u.player.teamName}
                </span>
              ))}
            </p>
          )}
        </section>
      ) : (
        <Panel className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-3xl text-yellow">DRAFT COMPLETE</p>
          <p className="text-sm text-ink-dim">
            All 30 teams are taken. Points start counting on opening night.
          </p>
        </Panel>
      )}

      {drafting && (
        <section>
          <SectionBar>{myTurn ? "PICK A TEAM" : "TEAM BOARD"}</SectionBar>
          <DraftBoard leagueId={league.id} teams={NBA_TEAMS} taken={taken} myTurn={myTurn} />
          <p className="mt-3 text-xs text-ink-dim">
            Projected records from{" "}
            <a href={PROJECTION_SOURCE.url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              {PROJECTION_SOURCE.label}
            </a>
            .
          </p>
        </section>
      )}

      <section>
        <SectionBar color="cyan">ROSTERS</SectionBar>
        <div className="grid gap-3 sm:grid-cols-2">
          {order.map((p, i) => {
            const mine = picks.filter((pk) => pk.playerId === p.id);
            return (
              <Panel key={p.id} className={onClock?.id === p.id ? "border-yellow" : ""}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-pixel text-[10px] text-yellow">#{i + 1}</span>
                  <span className="flex-1 truncate font-display text-lg leading-tight">{p.teamName}</span>
                  {p.id === me.id && <Badge tone="cyan">YOU</Badge>}
                </div>
                {mine.length === 0 ? (
                  <p className="text-sm text-ink-dim italic">No picks yet</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {mine.map((pk) => {
                      const t = TEAM_BY_ID.get(pk.nbaTeamId)!;
                      return (
                        <li key={pk.id} className="flex items-center gap-2 text-sm">
                          <span
                            className="font-pixel w-11 shrink-0 px-1 py-0.5 text-center text-[9px] text-white"
                            style={{ background: t.primaryColor }}
                          >
                            {t.id}
                          </span>
                          <span className="flex-1 truncate">
                            {t.city} {t.name}
                          </span>
                          <span className={`font-pixel text-[9px] ${pk.side === "W" ? "text-win" : "text-loss"}`}>
                            {pk.side === "W" ? "WINS" : "LOSSES"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      </section>

      {picks.length > 0 && (
        <section>
          <SectionBar color="yellow">PICK LOG</SectionBar>
          <Panel>
            <ol className="flex flex-col gap-1 text-sm">
              {[...picks].reverse().map((pk) => {
                const t = TEAM_BY_ID.get(pk.nbaTeamId)!;
                return (
                  <li key={pk.id} className="flex gap-3">
                    <span className="font-pixel w-8 shrink-0 text-[10px] leading-5 text-yellow">#{pk.pickNumber}</span>
                    <span className="flex-1">
                      <span className="text-ink-dim">{name(pk.playerId)}:</span> {t.city} {t.name}{" "}
                      <span className={pk.side === "W" ? "text-win" : "text-loss"}>
                        {pk.side === "W" ? "Wins" : "Losses"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </section>
      )}

      <section>
        <SectionBar color="cyan">YOUR TEAM</SectionBar>
        <Panel>
          <TeamNameForm leagueId={league.id} current={me.teamName} />
        </Panel>
      </section>
    </>
  );
}
