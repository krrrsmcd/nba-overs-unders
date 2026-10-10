import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { SeasonBoard } from "@/components/season-view";
import { Panel } from "@/components/ui";
import { DEMO_TODAY, demoSeason } from "@/lib/demo-season";

export const metadata: Metadata = { title: "Demo Scoreboard · Overs/Unders" };

/** A mid-season scoreboard filled with made-up results, for previewing the season screen. */
export default function DemoPage() {
  const { players, picks, games } = demoSeason();
  return (
    <PageShell>
      <Panel className="border-cyan">
        <p className="font-pixel text-[10px] leading-relaxed text-cyan">
          DEMO · MADE-UP RESULTS THROUGH JAN 20, 2027
        </p>
      </Panel>
      <SeasonBoard
        league={{ id: "demo", name: "Demo League", size: players.length }}
        me={players[0]}
        players={players}
        picks={picks}
        games={games}
        syncedLabel="Sample data, not real scores"
        today={DEMO_TODAY}
        demo
      />
    </PageShell>
  );
}
