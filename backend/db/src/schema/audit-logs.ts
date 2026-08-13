import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { genId } from "./helpers";

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey().default(genId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizationsTable.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  organizationCreatedAtIdx: index("idx_audit_logs_organization_created_at").on(table.organizationId, table.createdAt.desc()),
  organizationActionIdx: index("idx_audit_logs_organization_action").on(table.organizationId, table.action),
  actorCreatedAtIdx: index("idx_audit_logs_actor_created_at").on(table.actorId, table.createdAt.desc()),
  targetIdx: index("idx_audit_logs_target").on(table.organizationId, table.targetType, table.targetId),
}));

export type AuditLog = typeof auditLogsTable.$inferSelect;
