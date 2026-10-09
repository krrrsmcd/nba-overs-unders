import { and, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, schema } from "@/db";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/** Private link: /p/<token> logs this browser in as that player, then goes to the league. */
export async function GET(request: NextRequest, ctx: RouteContext<"/p/[token]">) {
  const { token } = await ctx.params;
  const db = getDb();
  const [player] = await db
    .select({ id: schema.players.id })
    .from(schema.players)
    .where(eq(schema.players.token, token));

  if (!player) {
    return NextResponse.redirect(new URL("/?link=invalid", request.url));
  }

  await db
    .update(schema.players)
    .set({ firstSeenAt: new Date() })
    .where(and(eq(schema.players.id, player.id), isNull(schema.players.firstSeenAt)));

  const res = NextResponse.redirect(new URL("/league", request.url));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
