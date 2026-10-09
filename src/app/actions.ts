"use server";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { NBA_TEAMS } from "@/db/teams";
import { isPermutationOf, positionForPick, shuffle, TOTAL_PICKS } from "@/lib/draft";
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

class UserError extends Error {}

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
      if (!league) throw new UserError("That invite link doesn't work.");

      const players = await tx
        .select({ userId: schema.players.userId, teamName: schema.players.teamName })
        .from(schema.players)
        .where(eq(schema.players.leagueId, league.id));
      if (players.some((p) => p.userId === user.id)) return league.id;
      if (league.status !== "setup" || players.length >= league.size) throw new UserError("This league is full.");
      if (players.some((p) => p.teamName?.toLowerCase() === teamName.toLowerCase()))
        throw new UserError("Another team already has that name.");

      await tx
        .insert(schema.players)
        .values({ leagueId: league.id, userId: user.id, teamName, firstSeenAt: new Date() });
      return league.id;
    });
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
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

/**
 * Commissioner only: lock the draft order and open the draft.
 * `customOrder` is a list of player ids (first pick first); omit it for a random order.
 */
export async function startDraft(leagueId: string, customOrder?: string[]): Promise<FormState> {
  const user = await getSessionUser();
  const me = user && (await getMembership(leagueId, user.id));
  if (!me?.player.isCommissioner) return { error: "Only the commissioner can start the draft." };

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [league] = await tx
        .select()
        .from(schema.leagues)
        .where(eq(schema.leagues.id, leagueId))
        .for("update");
      if (!league || league.status !== "setup") throw new UserError("The draft has already started.");

      const players = await tx
        .select({ id: schema.players.id, teamName: schema.players.teamName })
        .from(schema.players)
        .where(eq(schema.players.leagueId, leagueId));
      if (players.length < league.size) throw new UserError("Wait until every spot is filled.");
      if (players.some((p) => !p.teamName)) throw new UserError("Every player needs a team name first.");

      const ids = players.map((p) => p.id);
      let order: string[];
      if (customOrder) {
        if (!isPermutationOf(customOrder, ids)) throw new UserError("That draft order doesn't match the players.");
        order = customOrder;
      } else {
        order = shuffle(ids, () => randomInt(0, 2 ** 32) / 2 ** 32);
      }

      for (const [position, id] of order.entries()) {
        await tx.update(schema.players).set({ draftPosition: position }).where(eq(schema.players.id, id));
      }
      await tx
        .update(schema.leagues)
        .set({ status: "drafting", orderMode: customOrder ? "custom" : "random", draftStartedAt: new Date() })
        .where(eq(schema.leagues.id, leagueId));
    });
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
    throw err;
  }

  refresh();
  return { ok: true };
}

const TEAM_IDS = new Set(NBA_TEAMS.map((t) => t.id));

/** Make the current pick. Final once it succeeds. */
export async function makePick(leagueId: string, teamId: string, side: "W" | "L"): Promise<FormState> {
  const user = await getSessionUser();
  const me = user && (await getMembership(leagueId, user.id));
  if (!me) return { error: "You're not in this league." };
  if (!TEAM_IDS.has(teamId) || (side !== "W" && side !== "L")) return { error: "Invalid pick." };

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      // Lock the league so picks are made strictly one at a time.
      const [league] = await tx
        .select()
        .from(schema.leagues)
        .where(eq(schema.leagues.id, leagueId))
        .for("update");
      if (!league || league.status !== "drafting") throw new UserError("The draft isn't open.");

      const made = await tx
        .select({ nbaTeamId: schema.picks.nbaTeamId })
        .from(schema.picks)
        .where(eq(schema.picks.leagueId, leagueId));
      const pickIndex = made.length;
      if (positionForPick(pickIndex, league.size) !== me.player.draftPosition)
        throw new UserError("It's not your pick.");
      if (made.some((p) => p.nbaTeamId === teamId)) throw new UserError("That team is already taken.");

      await tx.insert(schema.picks).values({
        leagueId,
        pickNumber: pickIndex + 1,
        playerId: me.player.id,
        nbaTeamId: teamId,
        side,
      });
      if (pickIndex + 1 === TOTAL_PICKS) {
        await tx.update(schema.leagues).set({ status: "complete" }).where(eq(schema.leagues.id, leagueId));
      }
    });
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
    throw err;
  }

  refresh();
  return { ok: true };
}
