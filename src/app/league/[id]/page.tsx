import Link from "next/link";
import { SignInButton } from "@/components/auth-buttons";
import { AutoRefresh } from "@/components/draft-board";
import { DraftView } from "@/components/draft-view";
import { CommissionerZone } from "@/components/delete-league";
import { SeasonView } from "@/components/season-view";
import { CopyButton, RegenerateInviteButton, TeamNameForm } from "@/components/lobby-controls";
import { PageShell } from "@/components/page-shell";
import { StartDraftButton } from "@/components/start-draft";
import { Badge, buttonClass, Panel, SectionBar } from "@/components/ui";
import { getLeaguePlayers, getMembership, getOrigin, getSessionUser, type Player } from "@/lib/session";

export default function LeaguePage({ params }: PageProps<"/league/[id]">) {
  return (
    <PageShell>
      <League params={params} />
    </PageShell>
  );
}

const UUID = /^[0-9a-f-]{36}$/i;

async function League({ params }: { params: PageProps<"/league/[id]">["params"] }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return (
      <Panel className="flex flex-col items-center gap-4 text-center">
        <p className="font-pixel text-xs text-yellow">SIGN IN TO CONTINUE</p>
        <SignInButton callbackURL={`/league/${id}`} />
      </Panel>
    );
  }

  const me = UUID.test(id) ? await getMembership(id, user.id) : null;
  if (!me) {
    return (
      <Panel className="flex flex-col items-center gap-4 text-center">
        <p className="font-pixel text-xs leading-relaxed text-yellow">LEAGUE NOT FOUND</p>
        <p className="text-ink-dim">You&apos;re not in this league. Ask the commissioner for the invite link.</p>
        <Link href="/" className={buttonClass}>
          ◀ HOME
        </Link>
      </Panel>
    );
  }

  const { league, player } = me;
  if (league.status === "complete") return <SeasonView league={league} me={player} />;
  if (league.status === "drafting") return <DraftView league={league} me={player} />;

  const [players, origin] = await Promise.all([getLeaguePlayers(league.id), getOrigin()]);
  const openSlots = league.size - players.length;
  const isCommish = player.isCommissioner;
  const inviteUrl = `${origin}/join/${league.inviteCode}`;

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-[10px] text-cyan">
          {league.size}-PLAYER LEAGUE · LOBBY
        </p>
        <h1 className="arcade-title text-4xl leading-tight sm:text-5xl">{league.name}</h1>
      </header>

      <section>
        <SectionBar color="cyan">YOUR TEAM</SectionBar>
        <Panel>
          <TeamNameForm leagueId={league.id} current={player.teamName} />
        </Panel>
      </section>

      <section>
        <SectionBar>PLAYERS</SectionBar>
        <ul className="flex flex-col gap-3">
          {players.map((p, i) => (
            <PlayerRow key={p.id} p={p} label={`P${i + 1}`} isMe={p.id === player.id} />
          ))}
          {Array.from({ length: openSlots }, (_, i) => (
            <li key={`open-${i}`} className="flex items-center gap-3 border-4 border-dashed border-ink-dim p-3">
              <span className="font-pixel w-8 text-xs text-ink-dim">P{players.length + i + 1}</span>
              <span className="font-pixel blink text-[10px] text-ink-dim">OPEN SPOT</span>
            </li>
          ))}
        </ul>
      </section>

      {isCommish && openSlots > 0 && (
        <section>
          <SectionBar color="yellow">INVITE LINK</SectionBar>
          <Panel className="flex flex-col gap-3">
            <p className="text-sm text-ink-dim">
              Share this one link with everyone. Each person signs in with Google to take the next open spot.
            </p>
            <code className="block truncate bg-bg px-2 py-2 text-xs text-ink-dim">{inviteUrl}</code>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={inviteUrl} label="COPY LINK" />
              <RegenerateInviteButton leagueId={league.id} />
            </div>
          </Panel>
        </section>
      )}

      {/* Pick up new joins and the draft starting without a manual reload. */}
      <AutoRefresh everyMs={30_000} />

      <section className="flex flex-col items-center gap-3 text-center">
        {league.status === "setup" &&
          (isCommish ? (
            <>
              {openSlots > 0 ? (
                <>
                  <button type="button" disabled className={buttonClass}>
                    ▶ START DRAFT
                  </button>
                  <p className="font-pixel text-[10px] leading-relaxed text-ink-dim">
                    WAITING ON {openSlots} MORE {openSlots === 1 ? "PLAYER" : "PLAYERS"} TO JOIN
                  </p>
                </>
              ) : (
                <StartDraftButton
                  leagueId={league.id}
                  players={players.map((p) => ({ id: p.id, teamName: p.teamName ?? "Unnamed" }))}
                />
              )}
            </>
          ) : (
            <p className="font-pixel blink text-[10px] leading-relaxed text-yellow">
              WAITING FOR THE COMMISSIONER TO START THE DRAFT
            </p>
          ))}
      </section>
      {isCommish && <CommissionerZone leagueId={league.id} leagueName={league.name} />}
    </>
  );
}

function PlayerRow({ p, label, isMe }: { p: Player; label: string; isMe: boolean }) {
  return (
    <li className="pixel-border flex items-center gap-3 bg-panel p-3">
      <span className="font-pixel w-8 text-xs text-yellow">{label}</span>
      <span className="min-w-0 flex-1 font-medium break-words">{p.teamName}</span>
      <span className="flex flex-wrap justify-end gap-1">
        {p.isCommissioner && <Badge tone="yellow">COMMISH</Badge>}
        {isMe && <Badge tone="cyan">YOU</Badge>}
      </span>
    </li>
  );
}
