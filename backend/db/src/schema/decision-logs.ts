import { pgTable, text, jsonb, integer, timestamp, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { policiesTable } from "./policies";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const decisionLogsTable = pgTable("decision_logs", {
  id: text("id").primaryKey().default(genId()),
  requestId: text("request_id").unique().notNull(),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  decision: text("decision").notNull(),
  reason: text("reason").notNull(),
  context: jsonb("context").default({}).notNull(),
  latencyMs: integer("latency_ms").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  matchedPolicyId: text("matched_policy_id").references(() => policiesTable.id, { onDelete: "set null" }),
}, (table) => ({
  idxOrgCreatedAt: index("idx_decisions_org_created").on(table.organizationId, table.createdAt.desc()),
  idxOrgEntity: index("idx_decisions_org_entity").on(table.organizationId, table.entityId, table.entityType),
  idxOrgDecision: index("idx_decisions_org_decision").on(table.organizationId, table.decision),
  idxOrgActionResource: index("idx_decisions_org_action_resource").on(table.organizationId, table.action, table.resourceType),
  idxRequestId: index("idx_decisions_request_id").on(table.requestId),
  idxMatchedPolicy: index("idx_decisions_matched_policy").on(table.matchedPolicyId),
}));

export const insertDecisionLogSchema = createInsertSchema(decisionLogsTable).omit({ id: true, createdAt: true });
export type InsertDecisionLog = z.infer<typeof insertDecisionLogSchema>;
export type DecisionLog = typeof decisionLogsTable.$inferSelect;
