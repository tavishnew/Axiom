import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { createHash, randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@workspace/db";
import {
  invitationsTable,
  organizationsTable,
  sessionsTable,
  usersTable,
} from "@workspace/db/schema";
import {
  acceptInvitationSchema,
  createOrganizationInvitationSchema,
  invitationTokenSchema,
} from "@workspace/api-zod";
import { sendInvitationEmail, type EmailResult } from "../lib/email";
import { getEnv } from "../lib/env";
import { logger } from "../lib/logger";
import { logAuditEvent } from "../lib/audit";

const router: IRouter = Router();
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const acceptedByUsers = alias(usersTable, "accepted_by_user");

interface AuthUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
}

type AuthenticatedRequest = Request & { user?: AuthUser };

function getAuthUser(req: Request): AuthUser | undefined {
  return (req as AuthenticatedRequest).user;
}

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.session_token;
    if (!token) {
      res.status(401).json({ error: { message: "Authentication required" } });
      return;
    }

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.token, token), sql`${sessionsTable.expiresAt} > NOW()`))
      .limit(1);
    if (!session) {
      res.status(401).json({ error: { message: "Session expired or invalid" } });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, session.userId), isNull(usersTable.deletedAt)))
      .limit(1);
    if (!user || !user.organizationId) {
      res.status(401).json({ error: { message: "User not found" } });
      return;
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role,
    };
    next();
  } catch {
    res.status(500).json({ error: { message: "Authentication check failed" } });
  }
}

function requireAdminOrOwner(req: Request, res: Response, next: NextFunction): void {
  const user = getAuthUser(req);
  if (!user || !["admin", "owner"].includes(user.role)) {
    res.status(403).json({ error: { message: "Only organization owners and admins can manage invitations" } });
    return;
  }
  next();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

function buildInviteUrl(token: string): string {
  const env = getEnv();
  const baseUrl = env.INVITE_BASE_URL || env.FRONTEND_URL || "http://localhost:3002";
  return `${baseUrl.replace(/\/$/, "")}/invite/${token}`;
}

function serializeInvitation(invitation: typeof invitationsTable.$inferSelect, organization?: { id: string; name: string } | null) {
  const expired = invitation.status === "pending" && invitation.expiresAt.getTime() <= Date.now();
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: expired ? "expired" : invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    organization: organization ? { id: organization.id, name: organization.name } : undefined,
  };
}

async function getInvitationForToken(token: string) {
  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.tokenHash, hashToken(token)))
    .limit(1);
  if (!invitation) return null;

  const [organization] = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, invitation.organizationId))
    .limit(1);
  if (!organization) return null;

  if (invitation.status === "pending" && invitation.expiresAt.getTime() <= Date.now()) {
    await db
      .update(invitationsTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(invitationsTable.id, invitation.id), eq(invitationsTable.status, "pending")));
    return { ...invitation, status: "expired" as const, organization };
  }

  return { ...invitation, organization };
}

async function createSession(userId: string, res: Response): Promise<void> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ id: randomUUID(), token, userId, expiresAt });
  res.cookie("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: expiresAt,
  });
}

async function sendAndRecordInvitationEmail(
  invitationId: string,
  input: {
    to: string;
    inviterName: string;
    workspaceName: string;
    role: string;
    acceptUrl: string;
    expiresAt: Date;
  },
): Promise<EmailResult> {
  const result = await sendInvitationEmail(input);
  await db
    .update(invitationsTable)
    .set({
      deliveryStatus: result.status,
      deliveryError: result.delivered ? null : (result.reason ?? "Email delivery failed"),
      providerMessageId: result.providerMessageId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(invitationsTable.id, invitationId));

  if (!result.delivered) {
    logger.warn({ invitationId, to: input.to, status: result.status, reason: result.reason }, "Invitation email was not delivered");
  }
  return result;
}

const invitationRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many invitation attempts. Please try again shortly." } },
});

// Public token lookup for signup prefill. The token itself is never stored in plaintext.
async function getInvitationMetadata(req: Request, res: Response): Promise<void> {
  const tokenResult = invitationTokenSchema.safeParse({ token: req.params.token });
  if (!tokenResult.success) {
    res.status(400).json({ error: { message: "A valid invitation token is required" } });
    return;
  }

  const result = await getInvitationForToken(tokenResult.data.token);
  if (!result) {
    res.status(404).json({ error: { message: "Invitation not found" } });
    return;
  }

  const invitation = serializeInvitation(result, result.organization);
  res.json({ data: invitation });
}

router.get("/invitations/validate", async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const result = invitationTokenSchema.safeParse({ token });
  if (!result.success) {
    return res.status(400).json({ error: { message: "A valid invitation token is required" } });
  }

  const invitation = await getInvitationForToken(result.data.token);
  if (!invitation) {
    return res.status(404).json({ data: null, error: { code: "not_found", message: "Invitation not found" } });
  }

  const data = serializeInvitation(invitation, invitation.organization);
  return res.json({
    data: {
      email: data.email,
      role: data.role,
      workspaceName: invitation.organization.name,
      status: data.status,
      expiresAt: data.expiresAt,
    },
  });
});

router.get("/invitations/inviters", requireAuth, (_req: Request, res: Response) => {
  res.json({ data: [] });
});

router.get("/invitations/:token", invitationRateLimit, getInvitationMetadata);

// Public acceptance creates a new user directly in the invited organization and consumes the token.
router.post("/auth/accept-invite", invitationRateLimit, async (req: Request, res: Response) => {
  const parsed = acceptInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: "Invalid invitation acceptance data", issues: parsed.error.flatten() } });
  }

  const { token, name, email, password } = parsed.data;
  try {
    const invitation = await getInvitationForToken(token);
    if (!invitation) {
      return res.status(404).json({ error: { message: "Invitation not found" } });
    }
    if (invitation.status !== "pending") {
      return res.status(invitation.status === "expired" ? 410 : 409).json({ error: { message: "Invitation is no longer available" } });
    }
    if (invitation.email.toLowerCase() !== email) {
      return res.status(403).json({ error: { message: "Use the email address to which this invitation was sent" } });
    }

    const [existingUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existingUser) {
      return res.status(409).json({ error: { message: "An account already exists for this email. Please sign in to accept the invitation." } });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const userId = randomUUID();

    const created = await db.transaction(async (tx) => {
      await tx.insert(usersTable).values({
        id: userId,
        name,
        email,
        passwordHash,
        organizationId: invitation.organizationId,
        role: invitation.role,
      });

      const [accepted] = await tx
        .update(invitationsTable)
        .set({ status: "accepted", acceptedAt: now, acceptedById: userId, updatedAt: now })
        .where(and(eq(invitationsTable.id, invitation.id), eq(invitationsTable.status, "pending")))
        .returning({ id: invitationsTable.id });
      return Boolean(accepted);
    });

    if (!created) {
      return res.status(409).json({ error: { message: "Invitation was already used" } });
    }

    await createSession(userId, res);
    logAuditEvent({
      organizationId: invitation.organizationId,
      actorId: userId,
      action: "invitation.accepted",
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { email, role: invitation.role },
    });
    return res.status(201).json({
      data: {
        user: { id: userId, name, email, role: invitation.role },
        organization: invitation.organization,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to accept invitation");
    return res.status(500).json({ error: { message: "Failed to accept invitation" } });
  }
});

// Legacy authenticated acceptance remains available for existing accounts sent an invitation.
router.post("/invitations/accept", invitationRateLimit, requireAuth, async (req: Request, res: Response) => {
  const tokenResult = invitationTokenSchema.safeParse(req.body);
  if (!tokenResult.success) {
    return res.status(400).json({ error: { message: "A valid invitation token is required" } });
  }

  const user = getAuthUser(req)!;
  const invitation = await getInvitationForToken(tokenResult.data.token);
  if (!invitation) return res.status(404).json({ error: { message: "Invitation not found" } });
  if (invitation.status !== "pending") {
    return res.status(invitation.status === "expired" ? 410 : 409).json({ error: { message: "Invitation is no longer available" } });
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(403).json({ error: { message: "This invitation was sent to a different email address" } });
  }

  const now = new Date();
  const accepted = await db.transaction(async (tx) => {
    const [updatedInvitation] = await tx
      .update(invitationsTable)
      .set({ status: "accepted", acceptedAt: now, acceptedById: user.id, updatedAt: now })
      .where(and(eq(invitationsTable.id, invitation.id), eq(invitationsTable.status, "pending")))
      .returning({ id: invitationsTable.id });
    if (!updatedInvitation) return false;

    await tx
      .update(usersTable)
      .set({ organizationId: invitation.organizationId, role: invitation.role, updatedAt: now })
      .where(eq(usersTable.id, user.id));
    return true;
  });
  if (!accepted) return res.status(409).json({ error: { message: "Invitation was already used" } });
  logAuditEvent({
    organizationId: invitation.organizationId,
    actorId: user.id,
    action: "invitation.accepted",
    targetType: "invitation",
    targetId: invitation.id,
    metadata: { email: user.email, role: invitation.role },
  });
  return res.json({ data: { organization: invitation.organization, role: invitation.role } });
});

router.get("/invitations", requireAuth, requireAdminOrOwner, async (req: Request, res: Response) => {
  const user = getAuthUser(req)!;
  const includeTerminal = req.query.includeTerminal === "true";

  await db
    .update(invitationsTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(
      eq(invitationsTable.organizationId, user.organizationId),
      eq(invitationsTable.status, "pending"),
      sql`${invitationsTable.expiresAt} <= NOW()`,
    ));

  const rows = await db
    .select({
      invitation: invitationsTable,
      invitedByName: usersTable.name,
      invitedByEmail: usersTable.email,
      acceptedByName: acceptedByUsers.name,
      acceptedByEmail: acceptedByUsers.email,
    })
    .from(invitationsTable)
    .leftJoin(usersTable, eq(invitationsTable.invitedById, usersTable.id))
    .leftJoin(acceptedByUsers, eq(invitationsTable.acceptedById, acceptedByUsers.id))
    .where(includeTerminal
      ? eq(invitationsTable.organizationId, user.organizationId)
      : and(eq(invitationsTable.organizationId, user.organizationId), eq(invitationsTable.status, "pending")))
    .orderBy(sql`${invitationsTable.createdAt} DESC`);

  return res.json({
    data: rows.map(({ invitation, invitedByName, invitedByEmail, acceptedByName, acceptedByEmail }) => ({
      ...serializeInvitation(invitation),
      name: invitation.name,
      deliveryStatus: invitation.deliveryStatus,
      deliveryError: invitation.deliveryError,
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      acceptedBy: invitation.acceptedById
        ? { id: invitation.acceptedById, name: acceptedByName, email: acceptedByEmail }
        : null,
      revokedAt: invitation.revokedAt?.toISOString() ?? null,
      createdAt: invitation.createdAt.toISOString(),
      invitedById: invitation.invitedById,
      invitedBy: invitation.invitedById
        ? { id: invitation.invitedById, name: invitedByName, email: invitedByEmail }
        : null,
    })),
  });
});

async function createInvitation(req: Request, res: Response): Promise<void> {
  const parsed = createOrganizationInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid invitation data", issues: parsed.error.flatten() } });
    return;
  }

  const user = getAuthUser(req)!;
  const { email, name, role } = parsed.data;
  const [organization] = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, user.organizationId))
    .limit(1);
  if (!organization) {
    res.status(404).json({ error: { message: "Organization not found" } });
    return;
  }

  const [existingMember] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.organizationId, user.organizationId), eq(usersTable.email, email)))
    .limit(1);
  if (existingMember) {
    res.status(409).json({ error: { message: "This person is already a member of the organization" } });
    return;
  }

  const [existingInvitation] = await db
    .select({ id: invitationsTable.id })
    .from(invitationsTable)
    .where(and(
      eq(invitationsTable.organizationId, user.organizationId),
      eq(invitationsTable.email, email),
      eq(invitationsTable.status, "pending"),
      sql`${invitationsTable.expiresAt} > NOW()`,
    ))
    .limit(1);
  if (existingInvitation) {
    res.status(409).json({ error: { message: "A pending invitation already exists for this email" } });
    return;
  }

  const { token, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const acceptUrl = buildInviteUrl(token);
  const [invitation] = await db.insert(invitationsTable).values({
    organizationId: user.organizationId,
    email,
    name,
    role,
    tokenHash,
    invitedById: user.id,
    status: "pending",
    expiresAt,
  }).returning();

  const delivery = await sendAndRecordInvitationEmail(invitation.id, {
    to: email,
    inviterName: user.name,
    workspaceName: organization.name,
    role,
    acceptUrl,
    expiresAt,
  });
  logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    action: "invitation.created",
    targetType: "invitation",
    targetId: invitation.id,
    metadata: { email: invitation.email, role: invitation.role, deliveryStatus: delivery.status },
  });

  res.status(201).json({
    data: {
      ...serializeInvitation(invitation, organization),
      name: invitation.name,
      deliveryStatus: delivery.status,
      deliveryError: delivery.delivered ? null : delivery.reason,
      createdAt: invitation.createdAt.toISOString(),
      acceptUrl,
      inviteLink: acceptUrl,
    },
  });
}

router.post("/organizations/invite", requireAuth, requireAdminOrOwner, createInvitation);
router.post("/invitations", requireAuth, requireAdminOrOwner, createInvitation);

router.post("/invitations/:id/resend", requireAuth, requireAdminOrOwner, async (req: Request, res: Response) => {
  const user = getAuthUser(req)!;
  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(and(eq(invitationsTable.id, req.params.id as string), eq(invitationsTable.organizationId, user.organizationId)))
    .limit(1);
  if (!invitation) return res.status(404).json({ error: { message: "Invitation not found" } });
  if (invitation.status !== "pending" || invitation.expiresAt.getTime() <= Date.now()) {
    return res.status(409).json({ error: { message: "Only active pending invitations can be resent" } });
  }

  const { token, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const [updated] = await db
    .update(invitationsTable)
    .set({
      tokenHash,
      expiresAt,
      deliveryStatus: "pending",
      deliveryError: null,
      providerMessageId: null,
      updatedAt: new Date(),
    })
    .where(eq(invitationsTable.id, invitation.id))
    .returning();
  const [organization] = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, user.organizationId))
    .limit(1);
  const acceptUrl = buildInviteUrl(token);

  const delivery = await sendAndRecordInvitationEmail(updated.id, {
    to: updated.email,
    inviterName: user.name,
    workspaceName: organization?.name ?? "Axiom",
    role: updated.role,
    acceptUrl,
    expiresAt,
  });
  logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    action: "invitation.resent",
    targetType: "invitation",
    targetId: updated.id,
    metadata: { email: updated.email, expiresAt: updated.expiresAt.toISOString(), deliveryStatus: delivery.status },
  });

  return res.json({
    data: {
      ...serializeInvitation(updated, organization),
      name: updated.name,
      deliveryStatus: delivery.status,
      deliveryError: delivery.delivered ? null : delivery.reason,
      createdAt: updated.createdAt.toISOString(),
      acceptUrl,
      inviteLink: acceptUrl,
    },
  });
});

router.delete("/invitations/:id", requireAuth, requireAdminOrOwner, async (req: Request, res: Response) => {
  const user = getAuthUser(req)!;
  const [revoked] = await db
    .update(invitationsTable)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(invitationsTable.id, req.params.id as string),
      eq(invitationsTable.organizationId, user.organizationId),
      eq(invitationsTable.status, "pending"),
    ))
    .returning({ id: invitationsTable.id });
  if (!revoked) return res.status(404).json({ error: { message: "Invitation not found or already finalized" } });
  logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    action: "invitation.revoked",
    targetType: "invitation",
    targetId: revoked.id,
  });
  return res.json({ success: true, id: revoked.id });
});

export default router;
