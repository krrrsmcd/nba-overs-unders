import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, schema } from "@/db";
import { auth } from "@/lib/auth";

export type Player = typeof schema.players.$inferSelect;
export type League = typeof schema.leagues.$inferSelect;
export type SessionUser = { id: string; name: string; email: string; image?: string | null };

/** Random, URL-safe code for a league's shared invite link. */
export function newInviteCode(): string {
  return randomBytes(9).toString("base64url");
}

/** The signed-in Google user, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Leagues the user belongs to, newest first, with their team in each. */
export async function getMyLeagues(userId: string) {
  return getDb()
    .select({ league: schema.leagues, player: schema.players })
    .from(schema.players)
    .innerJoin(schema.leagues, eq(schema.players.leagueId, schema.leagues.id))
    .where(eq(schema.players.userId, userId))
    .orderBy(desc(schema.leagues.createdAt));
}

/** The user's team in a league, or null when they aren't a member. */
export async function getMembership(leagueId: string, userId: string) {
  const [row] = await getDb()
    .select({ league: schema.leagues, player: schema.players })
    .from(schema.players)
    .innerJoin(schema.leagues, eq(schema.players.leagueId, schema.leagues.id))
    .where(and(eq(schema.players.leagueId, leagueId), eq(schema.players.userId, userId)));
  return row ?? null;
}

/** Players in join order (P1 = commissioner). */
export async function getLeaguePlayers(leagueId: string): Promise<Player[]> {
  return getDb()
    .select()
    .from(schema.players)
    .where(eq(schema.players.leagueId, leagueId))
    .orderBy(asc(schema.players.createdAt), asc(schema.players.id));
}

export async function getLeagueByInviteCode(code: string): Promise<League | null> {
  const [league] = await getDb().select().from(schema.leagues).where(eq(schema.leagues.inviteCode, code));
  return league ?? null;
}

/** Absolute origin of the current request, for building shareable links. */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
