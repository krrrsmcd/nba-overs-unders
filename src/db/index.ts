import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Attach the Neon database in Vercel (see README).");
  }
  return drizzle(neon(url), { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

/** Lazily created so builds without a database still succeed. */
export function getDb() {
  _db ??= createDb();
  return _db;
}

export { schema };
