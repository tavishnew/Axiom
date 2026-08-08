import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { entitiesTable } from "./entities";
import { policiesTable } from "./policies";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const policyAssignmentsTable = pgTable("policy_assignments", {
  id: text("id").primaryKey().default(genId()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  entityId: text("entity_id").notNull().references(() => entitiesTable.id, { onDelete: "cascade" }),
  policyId: text("policy_id").notNull().references(() => policiesTable.id, { onDelete: "cascade" }),
}, (table) => ({
  idxEntityCreated: index("idx_policy_assignments_entity_created").on(table.entityId, table.createdAt.desc()),
  idxPolicyCreated: index("idx_policy_assignments_policy_created").on(table.policyId, table.createdAt.desc()),
}));

export const insertPolicyAssignmentSchema = createInsertSchema(policyAssignmentsTable).omit({ id: true, createdAt: true });
export type InsertPolicyAssignment = z.infer<typeof insertPolicyAssignmentSchema>;
export type PolicyAssignment = typeof policyAssignmentsTable.$inferSelect;
