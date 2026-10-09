import { NBA_TEAMS } from "@/db/teams";

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
        <p className="font-pixel blink mt-2 text-sm text-yellow">INSERT COIN</p>
      </header>

      <section className="w-full">
        <div className="skew-bar mb-4 inline-block bg-magenta px-4 py-2">
          <h2 className="font-pixel text-xs text-white">TEAM SELECT</h2>
        </div>
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
