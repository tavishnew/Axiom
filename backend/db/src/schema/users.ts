import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  organizationId: text("organization_id").references(() => organizationsTable.id, { onDelete: "set null" }),
  role: text("role").default("member").notNull(),
}, (table) => ({
  idxOrgRole: index("idx_users_org_role").on(table.organizationId, table.role),
  idxOrgCreatedAt: index("idx_users_org_created").on(table.organizationId, table.createdAt.desc()),
  idxEmail: index("idx_users_email").on(table.email),
}));

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
