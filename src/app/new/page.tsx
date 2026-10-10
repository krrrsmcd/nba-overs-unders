import Link from "next/link";
import { SignInButton } from "@/components/auth-buttons";
import { CreateLeagueForm } from "@/components/create-league-form";
import { PageShell } from "@/components/page-shell";
import { buttonClass, Panel, SectionBar } from "@/components/ui";
import { isCreationLocked } from "@/lib/season";
import { getSessionUser } from "@/lib/session";

export default function NewLeaguePage() {
  return (
    <PageShell back>
      <NewLeague />
    </PageShell>
  );
}

async function NewLeague() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Panel className="flex flex-col items-center gap-4 text-center">
        <p className="font-pixel text-xs text-yellow">SIGN IN TO CONTINUE</p>
        <SignInButton callbackURL="/new" />
      </Panel>
    );
  }

  if (await isCreationLocked()) {
    return (
      <Panel className="flex flex-col items-center gap-4 text-center">
        <p className="font-pixel text-[10px] leading-relaxed text-ink-dim">
          THE SEASON HAS TIPPED OFF. NEW LEAGUES ARE CLOSED.
        </p>
        <Link href="/" className={buttonClass}>
          ◀ HOME
        </Link>
      </Panel>
    );
  }

  return (
    <section>
      <SectionBar color="cyan">NEW LEAGUE</SectionBar>
      <Panel>
        <CreateLeagueForm />
      </Panel>
    </section>
  );
}
