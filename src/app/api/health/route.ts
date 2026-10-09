import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";

export async function GET() {
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

  const ok = checks.database === "ok" && checks.teams === 30;
  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503 });
}
