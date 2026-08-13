import { z } from "zod";

export const invitationRoleSchema = z.enum(["member", "admin"]);

export const createOrganizationInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(120).optional(),
  role: invitationRoleSchema.default("member"),
});

export const invitationTokenSchema = z.object({
  token: z.string().trim().min(32).max(512),
});

export const acceptInvitationSchema = invitationTokenSchema.extend({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(256),
});

export type CreateOrganizationInvitationInput = z.infer<typeof createOrganizationInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
