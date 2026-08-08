import { pgTable, text, jsonb, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { policiesTable } from "./policies";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const policyVersionsTable = pgTable("policy_versions", {
  id: text("id").primaryKey().default(genId()),
  version: integer("version").notNull(),
  effect: text("effect").notNull(),
  priority: integer("priority").notNull(),
  conditions: jsonb("conditions").notNull(),
  active: boolean("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  policyId: text("policy_id").notNull().references(() => policiesTable.id, { onDelete: "cascade" }),
}, (table) => ({
  idxPolicyCreated: index("idx_policy_versions_policy_created").on(table.policyId, table.createdAt.desc()),
  idxPolicyVersion: index("idx_policy_versions_policy_version").on(table.policyId, table.version.desc()),
}));

export const insertPolicyVersionSchema = createInsertSchema(policyVersionsTable).omit({ id: true, createdAt: true });
export type InsertPolicyVersion = z.infer<typeof insertPolicyVersionSchema>;
export type PolicyVersion = typeof policyVersionsTable.$inferSelect;
