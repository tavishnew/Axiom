import { sql } from "drizzle-orm";

/**
 * Default SQL expression for generating random UUIDs via pgcrypto.
 * Ensure `CREATE EXTENSION IF NOT EXISTS pgcrypto;` has been run on the database.
 */
export function genId() {
  return sql`gen_random_uuid()`;
}
