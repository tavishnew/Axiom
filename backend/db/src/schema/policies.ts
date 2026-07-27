import { pgTable, text, jsonb, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const policiesTable = pgTable("policies", {
  id: text("id").primaryKey().default(genId()),
  name: text("name").notNull(),
  description: text("description"),
  effect: text("effect").default("deny").notNull(),
  priority: integer("priority").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  conditions: jsonb("conditions").default([]).notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
}, (table) => ({
  uniqueOrgName: unique().on(table.organizationId, table.name),
}));

export const insertPolicySchema = createInsertSchema(policiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = typeof policiesTable.$inferSelect;
