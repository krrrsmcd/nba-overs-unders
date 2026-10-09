"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { isCreationLocked } from "@/lib/season";
import { getCurrentPlayer, newToken, setSessionCookie } from "@/lib/session";

export type FormState = { error?: string; ok?: boolean } | undefined;

const LEAGUE_SIZES = [2, 3, 5] as const;
const MAX_TEAM_NAME = 24;
const MAX_LEAGUE_NAME = 40;

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export async function createLeague(_prev: FormState, formData: FormData): Promise<FormState> {
  const leagueName = clean(formData.get("leagueName"));
  const teamName = clean(formData.get("teamName"));
  const size = Number(formData.get("size"));

  if (!leagueName || leagueName.length > MAX_LEAGUE_NAME)
    return { error: `League name must be 1–${MAX_LEAGUE_NAME} characters.` };
  if (!teamName || teamName.length > MAX_TEAM_NAME)
    return { error: `Team name must be 1–${MAX_TEAM_NAME} characters.` };
  if (!LEAGUE_SIZES.includes(size as (typeof LEAGUE_SIZES)[number]))
    return { error: "Pick 2, 3 or 5 players." };
  if (await isCreationLocked())
    return { error: "The season has tipped off — new leagues are closed." };

  const db = getDb();
  const leagueId = crypto.randomUUID();
  const commishToken = newToken();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(schema.leagues).values({ id: leagueId, name: leagueName, size });
    await tx.insert(schema.players).values([
      { leagueId, teamName, token: commishToken, isCommissioner: true, firstSeenAt: now, createdAt: now },
      // Stagger createdAt so slots keep a stable P1, P2, … order.
      ...Array.from({ length: size - 1 }, (_, i) => ({
        leagueId,
        token: newToken(),
        createdAt: new Date(now.getTime() + (i + 1) * 1000),
      })),
    ]);
  });

  await setSessionCookie(commishToken);
  redirect("/league");
}

export async function updateTeamName(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentPlayer();
  if (!me) return { error: "Open your private link first." };

  const teamName = clean(formData.get("teamName"));
  if (!teamName || teamName.length > MAX_TEAM_NAME)
    return { error: `Team name must be 1–${MAX_TEAM_NAME} characters.` };

  const db = getDb();
  const [taken] = await db
    .select({ id: schema.players.id })
    .from(schema.players)
    .where(
      and(
        eq(schema.players.leagueId, me.league.id),
        ne(schema.players.id, me.player.id),
        sql`lower(${schema.players.teamName}) = lower(${teamName})`,
      ),
    );
  if (taken) return { error: "Another team already has that name." };

  await db.update(schema.players).set({ teamName }).where(eq(schema.players.id, me.player.id));
  refresh();
  return { ok: true };
}

/** Commissioner only: replace another player's private link (the old one stops working). */
export async function regenerateLink(playerId: string): Promise<FormState> {
  const me = await getCurrentPlayer();
  if (!me?.player.isCommissioner) return { error: "Only the commissioner can do that." };
  if (playerId === me.player.id) return { error: "You can't regenerate your own link." };

  const db = getDb();
  const updated = await db
    .update(schema.players)
    .set({ token: newToken(), firstSeenAt: null })
    .where(and(eq(schema.players.id, playerId), eq(schema.players.leagueId, me.league.id)))
    .returning({ id: schema.players.id });
  if (updated.length === 0) return { error: "Player not found." };

  refresh();
  return { ok: true };
}
