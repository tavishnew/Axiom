import { pgTable, text, bigint, timestamp, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { genId } from "./helpers";

export const usageCountersTable = pgTable("usage_counters", {
  id: text("id").primaryKey().default(genId()),
  entityId: text("entity_id").notNull(),
  metric: text("metric").notNull(),
  count: bigint("count", { mode: "number" }).default(0).notNull(),
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEntityMetricWindow: unique().on(table.entityId, table.metric, table.windowStart),
}));

export const insertUsageCounterSchema = createInsertSchema(usageCountersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUsageCounter = z.infer<typeof insertUsageCounterSchema>;
export type UsageCounter = typeof usageCountersTable.$inferSelect;
