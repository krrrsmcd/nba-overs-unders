import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignInButton, SignOutButton } from "@/components/auth-buttons";
import { CreateLeagueForm } from "@/components/create-league-form";
import { Badge, Panel, SectionBar } from "@/components/ui";
import { NBA_TEAMS } from "@/db/teams";
import { isCreationLocked } from "@/lib/season";
import { getMyLeagues, getSessionUser } from "@/lib/session";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-4 py-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <p className="font-pixel text-xs text-cyan">2026–27 SEASON</p>
        <h1 className="arcade-title text-5xl leading-none sm:text-7xl">
          OVERS
          <br />
          UNDERS
        </h1>
        <p className="max-w-md text-ink-dim">
          Draft every team. Pick <span className="font-semibold text-win">WINS</span> or{" "}
          <span className="font-semibold text-loss">LOSSES</span>. Every one counts for a point.
        </p>
      </header>

      <section className="w-full max-w-lg">
        <Suspense fallback={<p className="font-pixel blink text-center text-sm text-yellow">LOADING…</p>}>
          <StartPanel />
        </Suspense>
      </section>

      <section className="w-full">
        <SectionBar>TEAM SELECT</SectionBar>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {NBA_TEAMS.map((t) => (
            <li
              key={t.id}
              className="pixel-border flex flex-col gap-1 p-3"
              style={{
                background: `linear-gradient(135deg, ${t.primaryColor} 0%, ${t.primaryColor} 72%, ${t.secondaryColor} 72%)`,
              }}
            >
              <span className="font-pixel text-sm text-white [text-shadow:2px_2px_0_#000]">{t.id}</span>
              <span className="text-xs font-medium text-white [text-shadow:1px_1px_0_#000]">
                {t.city} {t.name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex gap-6 text-xs text-ink-dim">
        <Link href="/privacy" className="hover:text-ink">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-ink">
          Terms
        </Link>
      </footer>
    </main>
  );
}

async function StartPanel() {
  await connection(); // request-time: reads the session and the current time
  const user = await getSessionUser();

  if (!user) {
    return (
      <Panel className="flex flex-col items-center gap-4 text-center">
        <p className="font-pixel text-[10px] leading-relaxed text-yellow blink">PRESS START</p>
        <p className="text-ink-dim">Sign in to create a league or get back to yours.</p>
        <SignInButton />
      </Panel>
    );
  }

  const [leagues, locked] = await Promise.all([getMyLeagues(user.id), isCreationLocked()]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm text-ink-dim">
          Signed in as <span className="text-ink">{user.email}</span>
        </p>
        <SignOutButton />
      </div>

      {leagues.length > 0 && (
        <div>
          <SectionBar color="yellow">YOUR LEAGUES</SectionBar>
          <ul className="flex flex-col gap-3">
            {leagues.map(({ league, player }) => (
              <li key={league.id}>
                <Link
                  href={`/league/${league.id}`}
                  className="pixel-border flex items-center gap-3 bg-panel p-4 hover:bg-panel-2"
                >
                  <span className="flex flex-1 flex-col">
                    <span className="font-display text-lg leading-tight">{league.name}</span>
                    <span className="text-sm text-ink-dim">{player.teamName}</span>
                  </span>
                  {player.isCommissioner && <Badge tone="yellow">COMMISH</Badge>}
                  <span className="font-pixel text-xs text-yellow">▶</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {locked ? (
        <Panel className="text-center">
          <p className="font-pixel text-[10px] leading-relaxed text-ink-dim">
            THE SEASON HAS TIPPED OFF. NEW LEAGUES ARE CLOSED.
          </p>
        </Panel>
      ) : (
        <div>
          <SectionBar color="cyan">NEW LEAGUE</SectionBar>
          <Panel>
            <CreateLeagueForm />
          </Panel>
        </div>
      )}
    </div>
  );
}
