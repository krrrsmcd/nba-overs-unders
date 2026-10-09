import "server-only";
import { randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { getDb, schema } from "@/db";

export const SESSION_COOKIE = "ou_player";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR,
};

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export type Player = typeof schema.players.$inferSelect;
export type League = typeof schema.leagues.$inferSelect;

/** The player whose private link this browser last opened, or null. */
export async function getCurrentPlayer(): Promise<{ player: Player; league: League } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const [row] = await db
    .select({ player: schema.players, league: schema.leagues })
    .from(schema.players)
    .innerJoin(schema.leagues, eq(schema.players.leagueId, schema.leagues.id))
    .where(eq(schema.players.token, token));
  return row ?? null;
}

export async function getLeaguePlayers(leagueId: string): Promise<Player[]> {
  return getDb()
    .select()
    .from(schema.players)
    .where(eq(schema.players.leagueId, leagueId))
    .orderBy(asc(schema.players.createdAt), asc(schema.players.id));
}

/** Absolute origin of the current request, for building shareable links. */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
