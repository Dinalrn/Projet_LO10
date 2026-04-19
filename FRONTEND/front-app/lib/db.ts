/**
 * Singleton PostgreSQL connection pool for Next.js API routes.
 * Uses the pg library (Node.js runtime only — never import in middleware or Edge routes).
 */
import { Pool } from "pg";

declare global {
  // Prevent creating multiple pools during Next.js hot reload in dev
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return new Pool({ connectionString: url });
}

const pool: Pool = globalThis._pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = pool;
}

export default pool;
