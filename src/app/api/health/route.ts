import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";

export async function GET(request: Request) {
  await connection(); // always run at request time

  const checks: Record<string, unknown> = {
    database: "unknown",
    teams: null,
    balldontlieKey: Boolean(process.env.BALLDONTLIE_API_KEY),
  };

  try {
    const db = getDb();
    const rows = await db.execute<{ count: number }>(sql`select count(*)::int as count from nba_teams`);
    checks.database = "ok";
    checks.teams = rows.rows[0]?.count ?? 0;
  } catch (err) {
    checks.database = "error";
    checks.error = err instanceof Error ? err.message : String(err);
  }

  // ?deep=1 also calls balldontlie (counts against the 5 req/min free limit).
  if (new URL(request.url).searchParams.get("deep") === "1") {
    checks.balldontlie = await checkBalldontlie();
  }

  const ok = checks.database === "ok" && checks.teams === 30;
  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503 });
}

async function checkBalldontlie() {
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) return { ok: false, error: "BALLDONTLIE_API_KEY not set" };
  const url =
    "https://api.balldontlie.io/v1/games?seasons[]=2026&start_date=2026-10-20&end_date=2026-10-21&per_page=100";
  try {
    const res = await fetch(url, { headers: { Authorization: key }, cache: "no-store" });
    if (!res.ok) return { ok: false, status: res.status, error: (await res.text()).slice(0, 200) };
    const body = (await res.json()) as {
      data: { datetime: string | null; date: string; home_team: { abbreviation: string }; visitor_team: { abbreviation: string } }[];
    };
    const games = body.data.map((g) => ({
      date: g.date,
      tipoff: g.datetime,
      matchup: `${g.visitor_team.abbreviation} @ ${g.home_team.abbreviation}`,
    }));
    games.sort((a, b) => String(a.tipoff).localeCompare(String(b.tipoff)));
    return { ok: games.length > 0, openingGames: games.length, firstGame: games[0] ?? null, games };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
