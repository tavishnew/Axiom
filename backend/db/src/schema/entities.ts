import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const entitiesTable = pgTable("entities", {
  id: text("id").primaryKey().default(genId()),
  externalId: text("external_id").notNull(),
  type: text("type").notNull(),
  attributes: jsonb("attributes").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
}, (table) => ({
  idxOrgType: index("idx_entities_org_type").on(table.organizationId, table.type),
  idxOrgCreatedAt: index("idx_entities_org_created").on(table.organizationId, table.createdAt.desc()),
}));

export const insertEntitySchema = createInsertSchema(entitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entitiesTable.$inferSelect;
