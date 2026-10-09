import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function createDb() {
  // DATABASE_URL comes from the Neon integration in Vercel. Without it, queries fail at
  // request time (the pool connects lazily), but builds and imports still succeed.
  const url = process.env.DATABASE_URL ?? "";
  const local = !url || /localhost|127\.0\.0\.1/.test(url);
  // Small pool: serverless functions handle one request at a time.
  const pool = new Pool({ connectionString: url, max: 3, ...(local ? { ssl: false } : {}) });
  return drizzle(pool, { schema });
}

type Db = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { __db?: Db };

/** Created once and reused across requests. */
export function getDb(): Db {
  globalForDb.__db ??= createDb();
  return globalForDb.__db;
}

export { schema };
