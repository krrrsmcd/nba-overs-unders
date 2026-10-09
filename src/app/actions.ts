"use server";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { isCreationLocked } from "@/lib/season";
import { getMembership, getSessionUser, newInviteCode } from "@/lib/session";

export type FormState = { error?: string; ok?: boolean } | undefined;

const LEAGUE_SIZES = [2, 3, 5] as const;
const MAX_TEAM_NAME = 24;
const MAX_LEAGUE_NAME = 40;

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function teamNameError(name: string): string | undefined {
  if (!name || name.length > MAX_TEAM_NAME) return `Team name must be 1–${MAX_TEAM_NAME} characters.`;
}

class JoinError extends Error {}

export async function createLeague(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in first." };

  const leagueName = clean(formData.get("leagueName"));
  const teamName = clean(formData.get("teamName"));
  const size = Number(formData.get("size"));

  if (!leagueName || leagueName.length > MAX_LEAGUE_NAME)
    return { error: `League name must be 1–${MAX_LEAGUE_NAME} characters.` };
  const nameErr = teamNameError(teamName);
  if (nameErr) return { error: nameErr };
  if (!LEAGUE_SIZES.includes(size as (typeof LEAGUE_SIZES)[number]))
    return { error: "Pick 2, 3 or 5 players." };
  if (await isCreationLocked())
    return { error: "The season has tipped off — new leagues are closed." };

  const db = getDb();
  const leagueId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(schema.leagues).values({ id: leagueId, name: leagueName, size, inviteCode: newInviteCode() });
    await tx
      .insert(schema.players)
      .values({ leagueId, userId: user.id, teamName, isCommissioner: true, firstSeenAt: new Date() });
  });

  redirect(`/league/${leagueId}`);
}

/** Join the league behind an invite code, taking the next open slot. */
export async function joinLeague(code: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in first." };

  const teamName = clean(formData.get("teamName"));
  const nameErr = teamNameError(teamName);
  if (nameErr) return { error: nameErr };

  const db = getDb();
  let leagueId: string;
  try {
    leagueId = await db.transaction(async (tx) => {
      // Lock the league row so two people can't take the last slot at once.
      const [league] = await tx
        .select()
        .from(schema.leagues)
        .where(eq(schema.leagues.inviteCode, code))
        .for("update");
      if (!league) throw new JoinError("That invite link doesn't work.");

      const players = await tx
        .select({ userId: schema.players.userId, teamName: schema.players.teamName })
        .from(schema.players)
        .where(eq(schema.players.leagueId, league.id));
      if (players.some((p) => p.userId === user.id)) return league.id;
      if (league.status !== "setup" || players.length >= league.size) throw new JoinError("This league is full.");
      if (players.some((p) => p.teamName?.toLowerCase() === teamName.toLowerCase()))
        throw new JoinError("Another team already has that name.");

      await tx
        .insert(schema.players)
        .values({ leagueId: league.id, userId: user.id, teamName, firstSeenAt: new Date() });
      return league.id;
    });
  } catch (err) {
    if (err instanceof JoinError) return { error: err.message };
    throw err;
  }

  redirect(`/league/${leagueId}`);
}

export async function updateTeamName(leagueId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  const me = user && (await getMembership(leagueId, user.id));
  if (!me) return { error: "You're not in this league." };

  const teamName = clean(formData.get("teamName"));
  const nameErr = teamNameError(teamName);
  if (nameErr) return { error: nameErr };

  const db = getDb();
  const [taken] = await db
    .select({ n: count() })
    .from(schema.players)
    .where(
      and(
        eq(schema.players.leagueId, leagueId),
        ne(schema.players.id, me.player.id),
        sql`lower(${schema.players.teamName}) = lower(${teamName})`,
      ),
    );
  if (taken.n > 0) return { error: "Another team already has that name." };

  await db.update(schema.players).set({ teamName }).where(eq(schema.players.id, me.player.id));
  refresh();
  return { ok: true };
}

/** Commissioner only: replace the league's invite link (the old one stops working). */
export async function regenerateInvite(leagueId: string): Promise<FormState> {
  const user = await getSessionUser();
  const me = user && (await getMembership(leagueId, user.id));
  if (!me?.player.isCommissioner) return { error: "Only the commissioner can do that." };

  await getDb().update(schema.leagues).set({ inviteCode: newInviteCode() }).where(eq(schema.leagues.id, leagueId));
  refresh();
  return { ok: true };
}
