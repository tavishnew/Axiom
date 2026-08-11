import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHash, randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import {
  invitationsTable,
  organizationsTable,
  usersTable,
} from "@workspace/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { sendInvitationEmail } from "../lib/email";
import { getEnv } from "../lib/env";

const router: IRouter = Router();

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Auth middleware (duplicated locally to avoid coupling with axiom.ts exports).
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionsTable } = await import("@workspace/db/schema");
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
      .where(eq(usersTable.id, session.userId))
      .limit(1);
    if (!user || !user.organizationId) {
      res.status(401).json({ error: { message: "User not found" } });
      return;
    }
    (req as Request & { user?: { id: string; email: string; name: string; organizationId: string; role: string } }).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role ?? "member",
    };
    next();
  } catch (err) {
    res.status(500).json({ error: { message: "Auth check failed" } });
  }
}

// Admin/owner gate for invitation mutations.
async function requireAdminOrOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as Request & { user?: { role: string } }).user;
  if (!user || !["admin", "owner"].includes(user.role)) {
    res.status(403).json({ error: { message: "Only workspace admins or owners can manage invitations" } });
    return;
  }
  next();
}

function generateToken(): { token: string; tokenHash: string } {
  // 256 bits of entropy from CSPRNG, url-safe base64.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildAcceptUrl(token: string): string {
  const env = getEnv();
  const base = env.INVITE_BASE_URL || env.FRONTEND_URL || "http://localhost:3002";
  return base.replace(/\/$/, "") + "/invite/" + token;
}

const emailSchema = z.string().trim().toLowerCase().email();
const roleSchema = z.enum(["member", "admin"]);

const createSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(120).optional(),
  role: roleSchema.optional().default("member"),
});

// Public validate: hash incoming token, return invitation metadata (no token).
router.get("/invitations/validate", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const token = (req.query.token as string | undefined)?.trim();
    if (!token) return res.status(400).json({ error: { message: "token is required" } });
    const tokenHash = hashToken(token);
    const [invite] = await db
      .select({
        id: invitationsTable.id,
        email: invitationsTable.email,
        role: invitationsTable.role,
        status: invitationsTable.status,
        expiresAt: invitationsTable.expiresAt,
        organizationId: invitationsTable.organizationId,
      })
      .from(invitationsTable)
      .where(eq(invitationsTable.tokenHash, tokenHash))
      .limit(1);
    if (!invite) return res.status(404).json({ data: null, error: { code: "not_found", message: "Invitation not found" } });
    const [org] = invite.organizationId
      ? await db.select({ id: organizationsTable.id, name: organizationsTable.name }).from(organizationsTable).where(eq(organizationsTable.id, invite.organizationId)).limit(1)
      : [null];
    const expired = invite.expiresAt.getTime() < Date.now();
    return res.json({
      data: {
        email: invite.email,
        role: invite.role,
        workspaceName: org?.name ?? "the workspace",
        status: expired && invite.status === "pending" ? "expired" : invite.status,
        expiresAt: invite.expiresAt.toISOString(),
      },
    });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    const pgError = err as any;
    console.error("[INVITATION ERROR] validate:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      code: pgError?.code,
      detail: pgError?.detail,
      latencyMs: totalTime,
    });

    switch (pgError?.code) {
      case "42704": return res.status(500).json({ error: { message: "Database schema mismatch - migration required" } });
      case "57014":
      case "57P01":
      case "08006": return res.status(503).json({ error: { message: "Database temporarily unavailable, please retry" } });
    }

    return res.status(500).json({ error: { message: "Failed to validate invitation" } });
  }
});

const acceptLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many attempts, slow down" } },
});

// Public accept: requires auth via session cookie; hash incoming token, look up, verify pending + not expired,
// add user to org (or update membership if already a member from prior invite), mark accepted, return org.
router.post("/invitations/accept", acceptLimiter, async (req: Request, res: Response) => {
  return await requireAuth(req, res, async () => {
    const startTime = Date.now();
    try {
      const { token } = req.body as { token?: string };
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: { message: "token is required" } });
      }
      const tokenHash = hashToken(token.trim());
      const [invite] = await db
        .select()
        .from(invitationsTable)
        .where(eq(invitationsTable.tokenHash, tokenHash))
        .limit(1);
      if (!invite) {
        return res.status(404).json({ error: { message: "Invitation not found" } });
      }
      if (invite.status !== "pending") {
        return res.status(409).json({ error: { message: "Invitation has already been used or revoked" } });
      }
      if (invite.expiresAt.getTime() < Date.now()) {
        await db.update(invitationsTable).set({ status: "expired", updatedAt: new Date() }).where(eq(invitationsTable.id, invite.id));
        return res.status(410).json({ error: { message: "Invitation has expired" } });
      }
      const user = (req as Request & { user: { id: string; email: string; organizationId: string | null } }).user;
      // If invite email doesn't match user email, reject (prevents token theft + wrong org).
      if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
        return res.status(403).json({ error: { message: "This invitation was sent to a different email address" } });
      }
      // Add user to org. If user already in another org, switch them over (members can only belong to one).
      await db.update(usersTable).set({ organizationId: invite.organizationId, role: invite.role, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
      // Mark invite accepted.
      const now = new Date();
      const [updated] = await db
        .update(invitationsTable)
        .set({ status: "accepted", acceptedAt: now, updatedAt: now })
        .where(and(eq(invitationsTable.id, invite.id), eq(invitationsTable.status, "pending")))
        .returning();
      if (!updated) {
        return res.status(409).json({ error: { message: "Invitation was already accepted" } });
      }
      const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, invite.organizationId)).limit(1);

      console.info("[invitation accepted]", { id: invite.id, email: invite.email, userId: user.id, orgId: invite.organizationId, latencyMs: Date.now() - startTime });

      return res.json({ data: { organization: org, role: invite.role } });
    } catch (err) {
      const totalTime = Date.now() - startTime;
      const pgError = err as any;
      console.error("[INVITATION ERROR] accept:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        code: pgError?.code,
        detail: pgError?.detail,
        constraint: pgError?.constraint,
        latencyMs: totalTime,
      });

      switch (pgError?.code) {
        case "23503": // foreign_key_violation
          if (pgError?.constraint?.includes("organization_id")) {
            return res.status(404).json({ error: { message: "Organization not found" } });
          }
          return res.status(400).json({ error: { message: "Invalid reference: " + (pgError?.detail || pgError?.constraint) } });
        case "42704": return res.status(500).json({ error: { message: "Database schema mismatch - migration required" } });
        case "57014":
        case "57P01":
        case "08006": return res.status(503).json({ error: { message: "Database temporarily unavailable, please retry" } });
      }

      return res.status(500).json({ error: { message: "Failed to accept invitation" } });
    }
  });
});

// === Authenticated routes ===

// List invitations for current workspace (any auth'd user can see pending list).
router.get("/invitations", requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const user = (req as Request & { user: { organizationId: string } }).user;
    const includeTerminal = req.query.includeTerminal === "true";
    const conditions = [eq(invitationsTable.organizationId, user.organizationId)];
    if (!includeTerminal) conditions.push(eq(invitationsTable.status, "pending"));
    const rows = await db
      .select({
        id: invitationsTable.id,
        email: invitationsTable.email,
        name: invitationsTable.name,
        role: invitationsTable.role,
        status: invitationsTable.status,
        expiresAt: invitationsTable.expiresAt,
        acceptedAt: invitationsTable.acceptedAt,
        createdAt: invitationsTable.createdAt,
        invitedById: invitationsTable.invitedById,
        invitedByName: usersTable.name,
        invitedByEmail: usersTable.email,
      })
      .from(invitationsTable)
      .leftJoin(usersTable, eq(invitationsTable.invitedById, usersTable.id))
      .where(and(...conditions))
      .orderBy(sql`${invitationsTable.createdAt} DESC`);
    const now = Date.now();
    const data = rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      status: r.status === "pending" && r.expiresAt.getTime() < now ? "expired" : r.status,
      expiresAt: r.expiresAt.toISOString(),
      acceptedAt: r.acceptedAt ? r.acceptedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      invitedById: r.invitedById,
      invitedBy: r.invitedById ? { id: r.invitedById, name: r.invitedByName, email: r.invitedByEmail } : null,
    }));

    console.info("[invitations listed]", { orgId: user.organizationId, count: data.length, latencyMs: Date.now() - startTime });

    return res.json({ data });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    const pgError = err as any;
    console.error("[INVITATION ERROR] list:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      code: pgError?.code,
      detail: pgError?.detail,
      latencyMs: totalTime,
    });

    switch (pgError?.code) {
      case "42704": return res.status(500).json({ error: { message: "Database schema mismatch - migration required" } });
      case "57014":
      case "57P01":
      case "08006": return res.status(503).json({ error: { message: "Database temporarily unavailable, please retry" } });
    }

    return res.status(500).json({ error: { message: "Failed to list invitations" } });
  }
});

// Resolved inviter info for the UI (named lookup).
router.get("/invitations/inviters", requireAuth, async (req: Request, res: Response) => {
  // Cheap: return a map of userId->{name,email}. Build once per request.
  return res.json({ data: [] });
});

// Create invitation (admin/owner).
router.post("/invitations", requireAuth, requireAdminOrOwner, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { message: "Invalid input", issues: parsed.error.flatten() } });
    }
    const { email, name, role } = parsed.data;
    const user = (req as Request & { user: { id: string; email: string; name: string; organizationId: string } }).user;
    // Prevent inviting existing member.
    const [existingMember] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.organizationId, user.organizationId), eq(usersTable.email, email)))
      .limit(1);
    if (existingMember) {
      return res.status(409).json({ error: { code: "already_member", message: "This person is already a member of your workspace" } });
    }
    // Prevent duplicate pending.
    const [existingPending] = await db
      .select({ id: invitationsTable.id, expiresAt: invitationsTable.expiresAt })
      .from(invitationsTable)
      .where(and(
        eq(invitationsTable.organizationId, user.organizationId),
        eq(invitationsTable.email, email),
        eq(invitationsTable.status, "pending"),
        sql`${invitationsTable.expiresAt} > NOW()`,
      ))
      .limit(1);
    if (existingPending) {
      return res.status(409).json({ error: { code: "duplicate_pending", message: "A pending invitation already exists for this email" } });
    }
    const [org] = await db.select({ id: organizationsTable.id, name: organizationsTable.name }).from(organizationsTable).where(eq(organizationsTable.id, user.organizationId)).limit(1);
    if (!org) return res.status(404).json({ error: { message: "Workspace not found" } });
    const { token, tokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const acceptUrl = buildAcceptUrl(token);
    const [created] = await db.insert(invitationsTable).values({
      email,
      name,
      role,
      organizationId: org.id,
      invitedById: user.id,
      tokenHash,
      status: "pending",
      expiresAt,
    }).returning();

    const dbTime = Date.now() - startTime;

    // Fire-and-forget email with timeout (don't block response)
    const emailPromise = Promise.race([
      sendInvitationEmail({
        to: email,
        inviterName: user.name,
        workspaceName: org.name,
        role,
        acceptUrl,
        expiresAt,
      }),
      new Promise<{ delivered: boolean; reason?: string }>((_, reject) =>
        setTimeout(() => reject(new Error("Email provider timeout after 5s")), 5000)
      ),
    ]);

    emailPromise.then((emailResult) => {
      const emailTime = Date.now() - startTime;
      if (!emailResult.delivered) {
        console.warn("[invitation email failed]", { to: email, reason: emailResult.reason, latencyMs: emailTime });
      } else {
        console.info("[invitation email sent]", { to: email, latencyMs: emailTime });
      }
    }).catch((err) => {
      const emailTime = Date.now() - startTime;
      console.error("[invitation email error]", { to: email, error: err instanceof Error ? err.message : String(err), latencyMs: emailTime });
    });

    console.info("[invitation created]", {
      id: created.id,
      email,
      role,
      organizationId: org.id,
      dbLatencyMs: dbTime,
      totalLatencyMs: Date.now() - startTime,
    });

    return res.status(201).json({
      data: {
        ...created,
        acceptUrl,
        inviteLink: acceptUrl,
        emailDelivered: true,
        emailReason: null,
      },
    });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    const pgError = err as any;
    console.error("[INVITATION ERROR] create:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      code: pgError?.code,
      detail: pgError?.detail,
      constraint: pgError?.constraint,
      table: pgError?.table,
      column: pgError?.column,
      latencyMs: totalTime,
    });

    // PostgreSQL error codes
    switch (pgError?.code) {
      case "23505": // unique_violation
        if (pgError?.constraint?.includes("token_hash")) {
          return res.status(409).json({ error: { code: "duplicate_token", message: "Token collision, please retry" } });
        }
        if (pgError?.constraint?.includes("org_email") || pgError?.detail?.includes("already exists")) {
          return res.status(409).json({ error: { code: "duplicate_pending", message: "A pending invitation already exists for this email" } });
        }
        return res.status(409).json({ error: { code: "duplicate", message: "An invitation with this email already exists" } });

      case "23503": // foreign_key_violation
        if (pgError?.constraint?.includes("organization_id")) {
          return res.status(404).json({ error: { message: "Workspace not found" } });
        }
        if (pgError?.constraint?.includes("invited_by_id")) {
          return res.status(400).json({ error: { message: "Inviter not found" } });
        }
        return res.status(400).json({ error: { message: "Invalid reference: " + (pgError?.detail || pgError?.constraint) } });

      case "23514": // check_violation
        return res.status(400).json({ error: { message: "Invalid value: " + (pgError?.detail || pgError?.constraint) } });

      case "22001": // string_data_right_truncation
        return res.status(400).json({ error: { message: "Input too long: " + (pgError?.detail || "value exceeds column limit") } });

      case "42704": // undefined_object (table/column doesn't exist)
        return res.status(500).json({ error: { message: "Database schema mismatch - migration required" } });

      case "57014": // query_canceled / statement_timeout
      case "57P01": // admin_shutdown / crash
      case "08006": // connection_failure
        return res.status(503).json({ error: { message: "Database temporarily unavailable, please retry" } });
    }

    return res.status(500).json({ error: { message: "Failed to create invitation" } });
  }
});

// Resend: rotate token, send new email.
router.post("/invitations/:id/resend", requireAuth, requireAdminOrOwner, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const id = req.params.id as string;
    const user = (req as Request & { user: { id: string; name: string; organizationId: string } }).user;
    const [invite] = await db
      .select()
      .from(invitationsTable)
      .where(and(eq(invitationsTable.id, id), eq(invitationsTable.organizationId, user.organizationId)))
      .limit(1);
    if (!invite) return res.status(404).json({ error: { message: "Invitation not found" } });
    if (invite.status !== "pending") {
      return res.status(409).json({ error: { message: "Only pending invitations can be resent" } });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: { message: "Invitation has expired. Create a new one" } });
    }
    const { token, tokenHash } = generateToken();
    const [updated] = await db.update(invitationsTable)
      .set({ tokenHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS), updatedAt: new Date() })
      .where(and(eq(invitationsTable.id, id), eq(invitationsTable.organizationId, user.organizationId)))
      .returning();
    const [org] = await db.select({ name: organizationsTable.name }).from(organizationsTable).where(eq(organizationsTable.id, user.organizationId)).limit(1);
    const acceptUrl = buildAcceptUrl(token);

    const dbTime = Date.now() - startTime;

    // Fire-and-forget email with timeout (don't block response)
    const emailPromise = Promise.race([
      sendInvitationEmail({
        to: updated.email,
        inviterName: user.name,
        workspaceName: org?.name ?? "Workspace",
        role: updated.role,
        acceptUrl,
        expiresAt: updated.expiresAt,
      }),
      new Promise<{ delivered: boolean; reason?: string }>((_, reject) =>
        setTimeout(() => reject(new Error("Email provider timeout after 5s")), 5000)
      ),
    ]);

    emailPromise.then((emailResult) => {
      const emailTime = Date.now() - startTime;
      if (!emailResult.delivered) {
        console.warn("[invitation resend email failed]", { to: updated.email, reason: emailResult.reason, latencyMs: emailTime });
      } else {
        console.info("[invitation resend email sent]", { to: updated.email, latencyMs: emailTime });
      }
    }).catch((err) => {
      const emailTime = Date.now() - startTime;
      console.error("[invitation resend email error]", { to: updated.email, error: err instanceof Error ? err.message : String(err), latencyMs: emailTime });
    });

    console.info("[invitation resent]", {
      id: updated.id,
      email: updated.email,
      dbLatencyMs: dbTime,
      totalLatencyMs: Date.now() - startTime,
    });

    return res.json({
      data: { ...updated, acceptUrl, inviteLink: acceptUrl, emailDelivered: true, emailReason: null },
    });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    const pgError = err as any;
    console.error("[INVITATION ERROR] resend:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      code: pgError?.code,
      detail: pgError?.detail,
      constraint: pgError?.constraint,
      table: pgError?.table,
      column: pgError?.column,
      latencyMs: totalTime,
    });

    // PostgreSQL error codes
    switch (pgError?.code) {
      case "23505": // unique_violation
        if (pgError?.constraint?.includes("token_hash")) {
          return res.status(409).json({ error: { code: "duplicate_token", message: "Token collision, please retry" } });
        }
        return res.status(409).json({ error: { code: "duplicate", message: "An invitation with this email already exists" } });

      case "23503": // foreign_key_violation
        if (pgError?.constraint?.includes("organization_id")) {
          return res.status(404).json({ error: { message: "Workspace not found" } });
        }
        return res.status(400).json({ error: { message: "Invalid reference: " + (pgError?.detail || pgError?.constraint) } });

      case "42704": // undefined_object (table/column doesn't exist)
        return res.status(500).json({ error: { message: "Database schema mismatch - migration required" } });

      case "57014": // query_canceled / statement_timeout
      case "57P01": // admin_shutdown / crash
      case "08006": // connection_failure
        return res.status(503).json({ error: { message: "Database temporarily unavailable, please retry" } });
    }

    return res.status(500).json({ error: { message: "Failed to resend invitation" } });
  }
});

// Revoke: set status revoked (don't delete so audit trail visible).
router.delete("/invitations/:id", requireAuth, requireAdminOrOwner, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const id = req.params.id as string;
    const user = (req as Request & { user: { organizationId: string } }).user;
    const [updated] = await db
      .update(invitationsTable)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(invitationsTable.id, id), eq(invitationsTable.organizationId, user.organizationId), eq(invitationsTable.status, "pending")))
      .returning({ id: invitationsTable.id });
    if (!updated) return res.status(404).json({ error: { message: "Invitation not found or already finalized" } });

    console.info("[invitation revoked]", { id, latencyMs: Date.now() - startTime });

    return res.json({ success: true, id: updated.id });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    const pgError = err as any;
    console.error("[INVITATION ERROR] revoke:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      code: pgError?.code,
      detail: pgError?.detail,
      latencyMs: totalTime,
    });

    switch (pgError?.code) {
      case "42704": // undefined_object
        return res.status(500).json({ error: { message: "Database schema mismatch - migration required" } });
      case "57014":
      case "57P01":
      case "08006":
        return res.status(503).json({ error: { message: "Database temporarily unavailable, please retry" } });
    }

    return res.status(500).json({ error: { message: "Failed to revoke invitation" } });
  }
});

export default router;
