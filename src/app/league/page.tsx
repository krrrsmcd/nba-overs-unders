import Link from "next/link";
import { Suspense } from "react";
import { CopyButton, RegenerateButton, TeamNameForm } from "@/components/lobby-controls";
import { Badge, buttonClass, Panel, SectionBar } from "@/components/ui";
import { getCurrentPlayer, getLeaguePlayers, getOrigin, type Player } from "@/lib/session";

export default function LeaguePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <Suspense fallback={<p className="font-pixel blink text-center text-sm text-yellow">LOADING…</p>}>
        <League />
      </Suspense>
    </main>
  );
}

function slotLabel(i: number) {
  return `P${i + 1}`;
}

async function League() {
  const me = await getCurrentPlayer();
  if (!me) {
    return (
      <Panel className="flex flex-col items-center gap-4 text-center">
        <p className="font-pixel text-xs leading-relaxed text-yellow">PLAYER NOT FOUND</p>
        <p className="text-ink-dim">Open the private link your commissioner sent you to join your league.</p>
        <Link href="/" className={buttonClass}>
          ◀ HOME
        </Link>
      </Panel>
    );
  }

  const { league, player } = me;
  const [players, origin] = await Promise.all([getLeaguePlayers(league.id), getOrigin()]);
  const unnamed = players
    .map((p, i) => ({ p, label: slotLabel(i) }))
    .filter(({ p }) => !p.teamName);
  const isCommish = player.isCommissioner;

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-[10px] text-cyan">
          {league.size}-PLAYER LEAGUE · {league.status === "setup" ? "LOBBY" : league.status.toUpperCase()}
        </p>
        <h1 className="arcade-title text-4xl leading-tight sm:text-5xl">{league.name}</h1>
      </header>

      <section>
        <SectionBar color="cyan">YOUR TEAM</SectionBar>
        <Panel>
          <TeamNameForm current={player.teamName} />
        </Panel>
      </section>

      <section>
        <SectionBar>PLAYERS</SectionBar>
        <ul className="flex flex-col gap-3">
          {players.map((p, i) => (
            <PlayerRow key={p.id} p={p} label={slotLabel(i)} isMe={p.id === player.id} />
          ))}
        </ul>
      </section>

      {isCommish && (
        <section>
          <SectionBar color="yellow">INVITE LINKS</SectionBar>
          <Panel className="flex flex-col gap-4">
            <p className="text-sm text-ink-dim">
              Send each player their own link. Anyone with a link can play as that team, so send them privately.
            </p>
            <ul className="flex flex-col gap-4">
              {players.map((p, i) => {
                const url = `${origin}/p/${p.token}`;
                const isMe = p.id === player.id;
                return (
                  <li key={p.id} className="flex flex-col gap-2 border-b-2 border-panel-2 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[10px] text-yellow">{slotLabel(i)}</span>
                      <span className="text-sm font-medium">{isMe ? "You" : (p.teamName ?? "Unnamed")}</span>
                    </div>
                    <code className="block truncate bg-bg px-2 py-2 text-xs text-ink-dim">{url}</code>
                    <div className="flex flex-wrap gap-2">
                      <CopyButton text={url} />
                      {!isMe && <RegenerateButton playerId={p.id} label={slotLabel(i)} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </section>
      )}

      <section className="flex flex-col items-center gap-3 text-center">
        {league.status === "setup" &&
          (isCommish ? (
            <>
              <button type="button" disabled className={buttonClass}>
                ▶ START DRAFT
              </button>
              <p className="font-pixel text-[10px] leading-relaxed text-ink-dim">
                {unnamed.length > 0
                  ? `WAITING ON ${unnamed.map((u) => u.label).join(", ")} TO NAME THEIR TEAM`
                  : "DRAFT ROOM OPENS IN THE NEXT UPDATE"}
              </p>
            </>
          ) : (
            <p className="font-pixel blink text-[10px] leading-relaxed text-yellow">
              WAITING FOR THE COMMISSIONER TO START THE DRAFT
            </p>
          ))}
      </section>
    </>
  );
}

function PlayerRow({ p, label, isMe }: { p: Player; label: string; isMe: boolean }) {
  return (
    <li className={`pixel-border flex items-center gap-3 bg-panel p-3 ${isMe ? "border-cyan" : ""}`}>
      <span className="font-pixel w-8 text-xs text-yellow">{label}</span>
      <span className={`flex-1 truncate font-medium ${p.teamName ? "" : "italic text-ink-dim"}`}>
        {p.teamName ?? "Waiting for a team name…"}
      </span>
      <span className="flex flex-wrap justify-end gap-1">
        {p.isCommissioner && <Badge tone="yellow">COMMISH</Badge>}
        {isMe && <Badge tone="cyan">YOU</Badge>}
        {!p.firstSeenAt && <Badge>NOT JOINED</Badge>}
      </span>
    </li>
  );
}
