import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: [
    "./src/schema/accounts.ts",
    "./src/schema/api-keys.ts",
    "./src/schema/decision-logs.ts",
    "./src/schema/entities.ts",
    "./src/schema/organizations.ts",
    "./src/schema/resources.ts",
    "./src/schema/policies.ts",
    "./src/schema/policy-assignments.ts",
    "./src/schema/policy-versions.ts",
    "./src/schema/users.ts",
    "./src/schema/verifications.ts",
    "./src/schema/sessions.ts",
    "./src/schema/usage-counters.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
