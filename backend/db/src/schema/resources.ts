import { pgTable, text, jsonb, timestamp, unique } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const resourcesTable = pgTable("resources", {
  id: text("id").primaryKey().default(genId()),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  attributes: jsonb("attributes").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
}, (table) => ({
  uniqueOrgTypeName: unique().on(table.organizationId, table.type, table.name),
}));

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
