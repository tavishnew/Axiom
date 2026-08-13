import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const apiKeysTable = pgTable("api_keys", {
  id: text("id").primaryKey().default(genId()),
  name: text("name").notNull(),
  hashedKey: text("hashed_key").unique().notNull(),
  prefix: text("prefix").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  createdById: text("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
}, (table) => ({
  idxOrgRevoked: index("idx_api_keys_org_revoked").on(table.organizationId, table.revokedAt),
  idxOrgCreatedAt: index("idx_api_keys_org_created").on(table.organizationId, table.createdAt.desc()),
  idxHashedKey: index("idx_api_keys_hashed_key").on(table.hashedKey),
  idxCreatedBy: index("idx_api_keys_created_by").on(table.createdById),
}));

export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeysTable.$inferSelect;
