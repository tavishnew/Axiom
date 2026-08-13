import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { genId } from "./helpers";

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const invitationDeliveryStatusEnum = pgEnum("invitation_delivery_status", [
  "pending",
  "sent",
  "failed",
  "configuration_error",
]);

export const invitationsTable = pgTable("invitations", {
  id: text("id").primaryKey().default(genId()),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").default("member").notNull(),
  organizationId: text("organization_id").references(() => organizationsTable.id, { onDelete: "cascade" }).notNull(),
  invitedById: text("invited_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  // SHA-256 hash of the plaintext token. Plaintext is sent via email and never stored.
  tokenHash: text("token_hash").unique().notNull(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  deliveryStatus: invitationDeliveryStatusEnum("delivery_status").default("pending").notNull(),
  deliveryError: text("delivery_error"),
  providerMessageId: text("provider_message_id"),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedById: text("accepted_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  idxOrgEmail: index("idx_invitations_org_email").on(table.organizationId, table.email),
  idxTokenHash: index("idx_invitations_token_hash").on(table.tokenHash),
  idxOrgStatus: index("idx_invitations_org_status").on(table.organizationId, table.status),
  idxOrgDelivery: index("idx_invitations_org_delivery").on(table.organizationId, table.deliveryStatus),
  idxOrgExpiresAt: index("idx_invitations_org_expires").on(table.organizationId, table.expiresAt),
}));

export const insertInvitationSchema = createInsertSchema(invitationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tokenHash: true,
  status: true,
  deliveryStatus: true,
  deliveryError: true,
  providerMessageId: true,
  acceptedAt: true,
  acceptedById: true,
  revokedAt: true,
});
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitationsTable.$inferSelect;
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];
