import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth-buttons";
import { JoinForm } from "@/components/lobby-controls";
import { PageShell } from "@/components/page-shell";
import { buttonClass, Panel } from "@/components/ui";
import { getLeagueByInviteCode, getLeaguePlayers, getMembership, getSessionUser } from "@/lib/session";

export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <PageShell>
      <Join params={params} />
    </PageShell>
  );
}

async function Join({ params }: { params: PageProps<"/join/[code]">["params"] }) {
  const { code } = await params;
  const [league, user] = await Promise.all([getLeagueByInviteCode(code), getSessionUser()]);

  if (!league) {
    return (
      <Message title="LINK NOT FOUND" tone="text-magenta">
        This invite link doesn&apos;t work. Ask your commissioner for the current one.
      </Message>
    );
  }

  if (user && (await getMembership(league.id, user.id))) redirect(`/league/${league.id}`);

  const players = await getLeaguePlayers(league.id);
  const open = league.size - players.length;

  if (open <= 0 || league.status !== "setup") {
    return (
      <Message title="LEAGUE FULL" tone="text-magenta">
        All {league.size} spots in <strong className="text-ink">{league.name}</strong> are taken.
      </Message>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-[10px] text-cyan">YOU&apos;RE INVITED</p>
        <h1 className="arcade-title text-4xl leading-tight sm:text-5xl">{league.name}</h1>
        <p className="text-ink-dim">
          {league.size}-player league · {open} {open === 1 ? "spot" : "spots"} left
        </p>
      </header>
      <Panel className="flex flex-col gap-4">
        {user ? (
          <>
            <p className="text-sm text-ink-dim">
              Joining as <span className="text-ink">{user.email}</span>
            </p>
            <JoinForm code={code} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-ink-dim">Sign in with Google to claim your spot.</p>
            <SignInButton callbackURL={`/join/${code}`} label="SIGN IN TO JOIN" />
          </div>
        )}
      </Panel>
    </div>
  );
}

function Message({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  return (
    <Panel className="flex flex-col items-center gap-4 py-10 text-center">
      <p className={`font-display text-4xl ${tone}`}>{title}</p>
      <p className="text-ink-dim">{children}</p>
      <Link href="/" className={buttonClass}>
        ◀ HOME
      </Link>
    </Panel>
  );
}
