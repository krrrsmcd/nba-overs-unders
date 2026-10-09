import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Attach the Neon database in Vercel (see README).");
  }
  const local = /localhost|127\.0\.0\.1/.test(url);
  // Small pool: serverless functions handle one request at a time.
  const pool = new Pool({ connectionString: url, max: 3, ...(local ? { ssl: false } : {}) });
  return drizzle(pool, { schema });
}

type Db = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { __db?: Db };

/** Lazily created (so builds without a database still succeed) and reused across requests. */
export function getDb(): Db {
  globalForDb.__db ??= createDb();
  return globalForDb.__db;
}

export { schema };
