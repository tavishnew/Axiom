import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Walk up from this file to find a .env (works whether CWD is project root or backend/).
let dir = __dirname;
for (let i = 0; i < 6; i++) {
  const candidate = path.join(dir, ".env");
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
  dir = path.dirname(dir);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production" ||
    process.env.DATABASE_URL?.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
