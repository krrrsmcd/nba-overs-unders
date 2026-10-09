import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

/**
 * Fallback opening tip-off (UTC) for 2026–27, from the balldontlie schedule
 * (BOS @ DET, Oct 20). Overridden by SEASON_OPENER_AT or by the synced value.
 */
const DEFAULT_OPENER = "2026-10-20T19:00:00Z";

export async function getSeasonOpenerAt(): Promise<Date> {
  if (process.env.SEASON_OPENER_AT) return new Date(process.env.SEASON_OPENER_AT);
  const db = getDb();
  const [row] = await db
    .select({ at: schema.syncState.seasonOpenerAt })
    .from(schema.syncState)
    .where(eq(schema.syncState.id, 1));
  return row?.at ?? new Date(DEFAULT_OPENER);
}

/** New leagues can't be created once the season's first game has tipped off. */
export async function isCreationLocked(now = new Date()): Promise<boolean> {
  return now >= (await getSeasonOpenerAt());
}
