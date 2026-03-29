import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database-backed routes will fail until it is configured.");
}

const globalForDb = globalThis as typeof globalThis & {
  __giftTrackerPool?: Pool;
};

const connectionString = process.env.DATABASE_URL;
const isLocalDatabase =
  !connectionString ||
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

const pool =
  globalForDb.__giftTrackerPool ??
  new Pool({
    connectionString,
    ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__giftTrackerPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
