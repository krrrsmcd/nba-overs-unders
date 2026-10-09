import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CreateLeagueForm } from "@/components/create-league-form";
import { buttonClass, Panel, SectionBar } from "@/components/ui";
import { NBA_TEAMS } from "@/db/teams";
import { isCreationLocked } from "@/lib/season";
import { getCurrentPlayer } from "@/lib/session";

export default function Home({ searchParams }: PageProps<"/">) {
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
          <StartPanel searchParams={searchParams} />
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
    </main>
  );
}

async function StartPanel({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  await connection(); // request-time: reads cookies and the current time
  const [{ link }, me, locked] = await Promise.all([searchParams, getCurrentPlayer(), isCreationLocked()]);

  return (
    <div className="flex flex-col gap-6">
      {link === "invalid" && (
        <Panel className="border-magenta">
          <p className="font-pixel text-[10px] leading-relaxed text-magenta">
            THAT LINK DOESN&apos;T WORK. ASK YOUR COMMISSIONER FOR A NEW ONE.
          </p>
        </Panel>
      )}

      {me && (
        <Panel className="flex flex-col items-center gap-3 text-center">
          <p className="font-pixel text-[10px] text-cyan">WELCOME BACK</p>
          <p className="font-display text-2xl">{me.player.teamName ?? "Unnamed team"}</p>
          <p className="text-sm text-ink-dim">{me.league.name}</p>
          <Link href="/league" className={buttonClass}>
            ▶ CONTINUE
          </Link>
        </Panel>
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
