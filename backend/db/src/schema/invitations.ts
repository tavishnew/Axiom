import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const invitationsTable = pgTable("invitations", {
  id: text("id").primaryKey().default(genId()),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").default("member").notNull(),
  organizationId: text("organization_id").references(() => organizationsTable.id, { onDelete: "cascade" }).notNull(),
  invitedById: text("invited_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  token: text("token").unique().notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  idxOrgEmail: index("idx_invitations_org_email").on(table.organizationId, table.email),
  idxToken: index("idx_invitations_token").on(table.token),
  idxOrgExpiresAt: index("idx_invitations_org_expires").on(table.organizationId, table.expiresAt),
}));

export const insertInvitationSchema = createInsertSchema(invitationsTable).omit({ id: true, createdAt: true, updatedAt: true, token: true, accepted: true });
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitationsTable.$inferSelect;