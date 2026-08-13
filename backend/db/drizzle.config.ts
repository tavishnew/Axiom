import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dir = __dirname;
for (let i = 0; i < 6; i++) {
  const candidate = path.join(dir, ".env");
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
  dir = path.dirname(dir);
}

export default defineConfig({
  schema: [
    "./src/schema/accounts.ts",
    "./src/schema/audit-logs.ts",
    "./src/schema/api-keys.ts",
    "./src/schema/decision-logs.ts",
    "./src/schema/entities.ts",
    "./src/schema/invitations.ts",
    "./src/schema/organizations.ts",
    "./src/schema/resources.ts",
    "./src/schema/policies.ts",
    "./src/schema/policy-assignments.ts",
    "./src/schema/policy-versions.ts",
    "./src/schema/users.ts",
    "./src/schema/verifications.ts",
    "./src/schema/sessions.ts",
  ],
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});