// Applies database migrations and seeds the 30 NBA teams.
// Runs automatically before `next build` on Vercel. Safe to run repeatedly.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { nbaTeams, syncState } from "../src/db/schema";
import { NBA_TEAMS } from "../src/db/teams";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[migrate] DATABASE_URL not set; skipping migrations and seed.");
    return;
  }
  const db = drizzle(neon(url));

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] migrations applied");

  await db
    .insert(nbaTeams)
    .values(NBA_TEAMS)
    .onConflictDoUpdate({
      target: nbaTeams.id,
      set: {
        city: sql`excluded.city`,
        name: sql`excluded.name`,
        conference: sql`excluded.conference`,
        primaryColor: sql`excluded.primary_color`,
        secondaryColor: sql`excluded.secondary_color`,
      },
    });
  await db.insert(syncState).values({ id: 1 }).onConflictDoNothing();
  console.log(`[migrate] seeded ${NBA_TEAMS.length} teams`);
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
