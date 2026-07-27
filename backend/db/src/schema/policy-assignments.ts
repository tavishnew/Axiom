import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
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
  uniqueEntityPolicy: unique().on(table.entityId, table.policyId),
}));

export const insertPolicyAssignmentSchema = createInsertSchema(policyAssignmentsTable).omit({ id: true, createdAt: true });
export type InsertPolicyAssignment = z.infer<typeof insertPolicyAssignmentSchema>;
export type PolicyAssignment = typeof policyAssignmentsTable.$inferSelect;
