import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import {
  organizationsTable,
  auditLogsTable,
  policiesTable,
  entitiesTable,
  resourcesTable,
  decisionLogsTable,
  apiKeysTable,
  usersTable,
  sessionsTable,
  policyAssignmentsTable,
  policyVersionsTable,
  invitationsTable,
  verificationsTable,
  insertPolicySchema,
  insertEntitySchema,
  insertResourceSchema,
  insertDecisionLogSchema,
  insertOrganizationSchema,
  insertApiKeySchema,
  insertUserSchema,
  insertSessionSchema,
  insertInvitationSchema,
} from "@workspace/db/schema";
import { eq, desc, and, or, isNull, inArray, sql, count as drizzleCount, like, ilike, asc } from "drizzle-orm";
import { randomUUID, createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { Policy, Entity, Resource, ApiKey } from "@workspace/db/schema";
import { logAuditEvent } from "../lib/audit";
import { sendPasswordResetEmail } from "../lib/email";
import { getEnv } from "../lib/env";
import { logger } from "../lib/logger";

// Stripe (lazy-load to avoid build issues if not configured)
let stripe: any = null;
async function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    const { default: Stripe } = await import("stripe");
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  }
  return stripe;
}

// Pagination & filter helpers
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

function getPagination(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function getSafeErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  const code = candidate.cause?.code ?? candidate.code;
  return typeof code === "string" ? code : undefined;
}

function getSearchTerm(req: Request): string | undefined {
  const q = req.query.q as string;
  return q?.trim() ? q.trim() : undefined;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

async function paginate<T>(
  query: any,
  countQuery: any,
  { page, limit, offset }: ReturnType<typeof getPagination>
): Promise<PaginatedResponse<T>> {
  const [items, [{ value: total }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery,
  ]);
  const totalPages = Math.ceil(Number(total) / limit);
  return {
    data: items as T[],
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

function sortByColumn(table: any, sortBy: string) {
  return table[sortBy] ?? table.id;
}

const router: IRouter = Router();

// ============================================================
// Update schemas for PATCH routes (partial, no system fields)
// ============================================================
const updateEntitySchema = createInsertSchema(entitiesTable).partial().omit({ id: true, organizationId: true, createdAt: true, updatedAt: true });
const updateResourceSchema = createInsertSchema(resourcesTable).partial().omit({ id: true, organizationId: true, createdAt: true, updatedAt: true });
const updateOrganizationSchema = createInsertSchema(organizationsTable).partial().omit({ id: true, createdAt: true, updatedAt: true });

// ============================================================
// Auth middleware — populates req.user from session cookie
// ============================================================
interface AuthUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
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

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role,
    };
    next();
  } catch (error) {
    res.status(500).json({ error: { message: "Auth check failed" } });
  }
}

function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "owner") {
    res.status(403).json({ error: { message: "Only organization owners can access audit logs" } });
    return;
  }
  next();
}

function requireTeamManager(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !["owner", "admin"].includes(req.user.role)) {
    res.status(403).json({ error: { message: "Only organization owners and admins can manage members" } });
    return;
  }
  next();
}

function requireWorkspaceManager(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !["owner", "admin"].includes(req.user.role)) {
    res.status(403).json({ error: { message: "Only organization owners and admins can change workspace data" } });
    return;
  }
  next();
}

// Helper: get cookie options (must match between set and clear)
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "lax" | "strict" | "none",
  };
}

// Helper: create session row + set cookie
async function createSession(userId: string, res: Response) {
  const id = randomUUID();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db.insert(sessionsTable).values({
    id,
    token,
    userId,
    expiresAt,
  });
  res.cookie("session_token", token, {
    ...getCookieOptions(),
    expires: expiresAt,
  });
  return token;
}

// Helper: clear session cookie (must use same options as set)
function clearSessionCookie(res: Response) {
  res.clearCookie("session_token", getCookieOptions());
}

// Rate limiters for auth routes (10 req/min per IP)
const authRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests, please try again later" } },
  skipSuccessfulRequests: false,
});

// Stricter limiter for sign-up (5 req/min per IP)
const signupRateLimit = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many sign-up attempts, please try again later" } },
});

// ============================================================
// Auth endpoints
// ============================================================
const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  // A public sign-up creates a new organization. Only its founder can be an owner;
  // admin and member access must be issued by an existing organization's invitation.
  role: z.enum(["owner", "admin", "member"]).optional().default("owner"),
});

router.post("/auth/sign-in", authRateLimit, async (req: Request, res: Response) => {
  try {
    const parsed = signInSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { message: "Enter a valid email address and password" } });
    }
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email), isNull(usersTable.deletedAt)))
      .limit(1);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    await createSession(user.id, res);

    return res.json({ data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
  } catch (error) {
    logger.error({
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: getSafeErrorCode(error),
    }, "Sign-in request failed");
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

router.post("/auth/sign-up", signupRateLimit, async (req: Request, res: Response) => {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: "Enter a valid name, email address, and password of at least 8 characters" } });
  }

  const { name, email, password, role } = parsed.data;
  if (role !== "owner") {
    return res.status(403).json({
      error: { message: "Admins and members must join through an organization invitation. Create a workspace as an owner, or ask an owner to invite you." },
    });
  }

  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (existing) {
      return res.status(409).json({ error: { message: "Email already in use" } });
    }

    const orgId = randomUUID();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    await db.transaction(async (tx) => {
      await tx.insert(organizationsTable).values({
        id: orgId,
        name: `${name}'s Org`,
        slug: `org-${randomUUID().slice(0, 8)}`,
      });
      await tx.insert(usersTable).values({
        id: userId,
        name,
        email,
        passwordHash,
        organizationId: orgId,
        role: "owner",
      });
    });

    await createSession(userId, res);
    logAuditEvent({
      organizationId: orgId,
      actorId: userId,
      action: "account.created",
      targetType: "user",
      targetId: userId,
      metadata: { role: "owner" },
    });

    return res.status(201).json({ data: { user: { id: userId, email, name, role: "owner" } } });
  } catch (error) {
    const errorCode = getSafeErrorCode(error);
    if (errorCode === "23505") {
      return res.status(409).json({ error: { message: "Email already in use" } });
    }
    logger.error({ errorName: error instanceof Error ? error.name : "UnknownError", errorCode }, "Sign-up request failed");
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

router.post("/auth/sign-out", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.session_token;
    if (token) {
      await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
      clearSessionCookie(res);
    }
    return res.json({ data: null });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

const forgotPasswordSchema = z.object({ email: z.string().trim().email() });
const resetPasswordSchema = z.object({ token: z.string().min(32), newPassword: z.string().min(8) });
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function passwordResetIdentifier(userId: string): string {
  return `password-reset:${userId}`;
}

function buildResetPasswordUrl(token: string): string {
  const env = getEnv();
  const baseUrl = env.PASSWORD_RESET_BASE_URL || env.FRONTEND_URL || "http://localhost:3002";
  return `${baseUrl.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

router.post("/auth/forgot-password", authRateLimit, async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  const genericResponse = { data: { message: "If an active account exists for that email address, a reset link has been sent." } };
  if (!parsed.success) return res.json(genericResponse);

  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(and(eq(usersTable.email, parsed.data.email), isNull(usersTable.deletedAt)))
      .limit(1);
    if (!user) return res.json(genericResponse);

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    const identifier = passwordResetIdentifier(user.id);

    await db.transaction(async (tx) => {
      await tx.delete(verificationsTable).where(eq(verificationsTable.identifier, identifier));
      await tx.insert(verificationsTable).values({
        id: randomUUID(),
        identifier,
        value: tokenHash,
        expiresAt,
      });
    });

    void sendPasswordResetEmail({
      to: user.email,
      recipientName: user.name,
      resetUrl: buildResetPasswordUrl(token),
      expiresAt,
    }).then((result) => {
      if (!result.delivered) {
        logger.warn({ userId: user.id, reason: result.reason }, "Password reset email was not delivered");
      }
    });
  } catch (error) {
    logger.error({ error }, "Password reset request failed");
  }
  return res.json(genericResponse);
});

router.post("/auth/reset-password", authRateLimit, async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: "A valid reset token and a password of at least 8 characters are required" } });
  }

  try {
    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const [verification] = await db
      .select()
      .from(verificationsTable)
      .where(and(eq(verificationsTable.value, tokenHash), sql`${verificationsTable.expiresAt} > NOW()`))
      .limit(1);
    if (!verification || !verification.identifier.startsWith("password-reset:")) {
      return res.status(400).json({ error: { message: "This password reset link is invalid or has expired" } });
    }

    const userId = verification.identifier.slice("password-reset:".length);
    const [user] = await db
      .select({ id: usersTable.id, organizationId: usersTable.organizationId })
      .from(usersTable)
      .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
      .limit(1);
    if (!user) {
      await db.delete(verificationsTable).where(eq(verificationsTable.id, verification.id));
      return res.status(400).json({ error: { message: "This password reset link is invalid or has expired" } });
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    const now = new Date();
    const consumed = await db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(verificationsTable)
        .where(and(eq(verificationsTable.id, verification.id), eq(verificationsTable.value, tokenHash)))
        .returning({ id: verificationsTable.id });
      if (!deleted) return false;
      await tx.update(usersTable).set({ passwordHash, updatedAt: now }).where(eq(usersTable.id, user.id));
      await tx.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
      return true;
    });
    if (!consumed) {
      return res.status(400).json({ error: { message: "This password reset link is invalid or has expired" } });
    }

    if (user.organizationId) {
      logAuditEvent({
        organizationId: user.organizationId,
        actorId: user.id,
        action: "account.password_reset",
        targetType: "user",
        targetId: user.id,
      });
    }
    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Password reset failed");
    return res.status(500).json({ error: { message: "Unable to reset password" } });
  }
});

// ============================================================
// Session info
// ============================================================
router.get("/auth/session", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.session_token;
    if (!token) {
      return res.json({ data: null });
    }

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.token, token), sql`${sessionsTable.expiresAt} > NOW()`))
      .limit(1);

    if (!session) {
      return res.json({ data: null });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, session.userId), isNull(usersTable.deletedAt)))
      .limit(1);

    if (!user) {
      await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
      clearSessionCookie(res);
      return res.json({ data: null });
    }

    return res.json({ data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// ============================================================
// User Profile & Auth (auth-protected)
// ============================================================
router.delete("/account", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const now = new Date();

    if (req.user!.role === "owner") {
      const [{ value: ownerCount }] = await db
        .select({ value: drizzleCount() })
        .from(usersTable)
        .where(and(
          eq(usersTable.organizationId, organizationId),
          eq(usersTable.role, "owner"),
          isNull(usersTable.deletedAt),
        ));
      if (Number(ownerCount) <= 1) {
        return res.status(409).json({ error: { message: "Transfer organization ownership before deleting the last owner account" } });
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)));
      await tx.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
      await tx
        .update(apiKeysTable)
        .set({ revokedAt: now, updatedAt: now })
        .where(and(eq(apiKeysTable.createdById, userId), isNull(apiKeysTable.revokedAt)));
    });

    logAuditEvent({
      organizationId,
      actorId: userId,
      action: "account.deleted",
      targetType: "user",
      targetId: userId,
      metadata: { softDeleted: true },
    });
    clearSessionCookie(res);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: { message: "Unable to delete account" } });
  }
});

router.get("/auth/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { passwordHash, ...safeUser } = user;
    return res.json({ data: safeUser });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

const updateProfileSchema = createInsertSchema(usersTable).pick({ name: true, image: true }).partial();
router.patch("/auth/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    const [user] = await db
      .update(usersTable)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user!.id))
      .returning();
    if (!user) return res.status(404).json({ error: "User not found" });
    const { passwordHash, ...safeUser } = user;
    return res.json({ data: safeUser });
  } catch (error: any) {
    return res.status(400).json({ error: { message: error.message || "Invalid request" } });
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
router.post("/auth/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: { message: "Invalid credentials" } });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { message: "Current password is incorrect" } });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, req.user!.id));
    // Optionally revoke all other sessions
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, req.user!.id));
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ error: { message: error.message || "Invalid request" } });
  }
});

router.get("/auth/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.userId, req.user!.id), sql`${sessionsTable.expiresAt} > NOW()`))
      .orderBy(desc(sessionsTable.createdAt));
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

router.delete("/auth/sessions/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id as string;
    const [session] = await db
      .delete(sessionsTable)
      .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.userId, req.user!.id)))
      .returning();
    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// ============================================================
// Organizations (auth-protected, scoped)
// ============================================================
router.get("/organizations", requireAuth, async (req: Request, res: Response) => {
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, req.user!.organizationId)).limit(1);
  return res.json(org ? [org] : []);
});

router.get("/organizations/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (id !== req.user!.organizationId) {
    return res.status(403).json({ error: "Access denied" });
  }
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
  if (!org) return res.status(404).json({ error: "Not found" });
  return res.json(org);
});

router.get("/audit-logs", requireAuth, requireOwner, async (req: Request, res: Response) => {
  const { page, limit, offset } = getPagination(req);
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const actorId = typeof req.query.actorId === "string" ? req.query.actorId : undefined;
  const targetType = typeof req.query.targetType === "string" ? req.query.targetType : undefined;

  const conditions = [eq(auditLogsTable.organizationId, req.user!.organizationId)];
  if (action) conditions.push(eq(auditLogsTable.action, action));
  if (actorId) conditions.push(eq(auditLogsTable.actorId, actorId));
  if (targetType) conditions.push(eq(auditLogsTable.targetType, targetType));

  const baseQuery = db
    .select({
      log: auditLogsTable,
      actorName: usersTable.name,
      actorEmail: usersTable.email,
    })
    .from(auditLogsTable)
    .leftJoin(usersTable, eq(auditLogsTable.actorId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(auditLogsTable.createdAt));
  const countQuery = db
    .select({ value: drizzleCount() })
    .from(auditLogsTable)
    .where(and(...conditions));

  const [rows, [{ value: total }]] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    countQuery,
  ]);
  const totalItems = Number(total);
  const totalPages = Math.ceil(totalItems / limit);

  return res.json({
    data: rows.map(({ log, actorName, actorEmail }) => ({
      id: log.id,
      actorId: log.actorId,
      actor: { id: log.actorId, name: actorName, email: actorEmail },
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total: totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
});

router.patch("/organizations/:id", requireAuth, requireOwner, async (req: Request, res: Response) => {
  if (req.params.id !== req.user!.organizationId) {
    return res.status(403).json({ error: "Access denied" });
  }
  const parsed = updateOrganizationSchema.parse(req.body);
  const [org] = await db.update(organizationsTable).set(parsed).where(eq(organizationsTable.id, req.params.id)).returning();
  if (!org) return res.status(404).json({ error: "Not found" });
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "organization.updated",
    targetType: "organization",
    targetId: org.id,
    metadata: { changedFields: Object.keys(parsed) },
  });
  return res.json(org);
});

// POST /organizations removed — organizations are created during sign-up only

// ============================================================
// Policies (auth-protected, tenant-scoped)
// ============================================================
router.get("/policies", requireAuth, async (req: Request, res: Response) => {
  const { page, limit, offset } = getPagination(req);
  const search = getSearchTerm(req);
  const effect = req.query.effect as string;
  const active = req.query.active as string;
  const sortBy = (req.query.sortBy as string) || "priority";
  const sortOrder = (req.query.sortOrder as string) || "desc";

  const conditions = [eq(policiesTable.organizationId, req.user!.organizationId)];
  if (search) conditions.push(or(ilike(policiesTable.name, `%${search}%`), ilike(policiesTable.description, `%${search}%`))!);
  if (effect && ["allow", "deny"].includes(effect)) conditions.push(eq(policiesTable.effect, effect));
  if (active && ["true", "false"].includes(active)) conditions.push(eq(policiesTable.active, active === "true"));

  const sortByColumn = (table: any, sortBy: string) => table[sortBy] ?? table.id;

  const orderBy = sortOrder === "asc" ? asc(sortByColumn(policiesTable, sortBy)) : desc(sortByColumn(policiesTable, sortBy));

  const baseQuery = db.select().from(policiesTable).where(and(...conditions)).orderBy(orderBy as any);
  const countQuery = db.select({ value: drizzleCount() }).from(policiesTable).where(and(...conditions));

  const result = await paginate(baseQuery, countQuery, { page, limit, offset });
  return res.json(result);
});

router.get("/policies/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [policy] = await db
    .select()
    .from(policiesTable)
    .where(and(eq(policiesTable.id, id), eq(policiesTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!policy) return res.status(404).json({ error: "Not found" });
  return res.json(policy);
});

router.post("/policies", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const parsed = createPolicySchema.parse(req.body);
  const [policy] = await db.insert(policiesTable).values({
    ...parsed,
    organizationId: req.user!.organizationId,
  }).returning();
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "policy.created",
    targetType: "policy",
    targetId: policy.id,
    metadata: { name: policy.name, effect: policy.effect, priority: policy.priority },
  });
  return res.json(policy);
});

router.patch("/policies/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const parsed = updatePolicySchema.parse(req.body);
  const id = req.params.id as string;

  // Snapshot current state to policy_versions before updating
  const [current] = await db
    .select()
    .from(policiesTable)
    .where(and(eq(policiesTable.id, id), eq(policiesTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!current) return res.status(404).json({ error: "Not found" });

  await db.insert(policyVersionsTable).values({
    policyId: current.id,
    version: current.version,
    effect: current.effect,
    priority: current.priority,
    conditions: current.conditions as Record<string, unknown>[],
    active: current.active,
  });

  const [policy] = await db
    .update(policiesTable)
    .set({ ...parsed, version: current.version + 1 })
    .where(and(eq(policiesTable.id, id), eq(policiesTable.organizationId, req.user!.organizationId)))
    .returning();
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "policy.updated",
    targetType: "policy",
    targetId: policy.id,
    metadata: { changedFields: Object.keys(parsed), version: policy.version },
  });
  return res.json(policy);
});

router.delete("/policies/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [policy] = await db
      .delete(policiesTable)
      .where(and(eq(policiesTable.id, id), eq(policiesTable.organizationId, req.user!.organizationId)))
      .returning();
    if (!policy) return res.status(404).json({ error: "Not found" });
    logAuditEvent({
      organizationId: req.user!.organizationId,
      actorId: req.user!.id,
      action: "policy.deleted",
      targetType: "policy",
      targetId: policy.id,
      metadata: { name: policy.name },
    });
    return res.json({ success: true });
  } catch (error: any) {
    if (error.code === "23503") {
      return res.status(409).json({ error: { message: "Policy is assigned to entities. Remove assignments first." } });
    }
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// Policy versions
router.get("/policies/:id/versions", requireAuth, async (req: Request, res: Response) => {
  const policyId = req.params.id as string;
  const [policy] = await db
    .select({ id: policiesTable.id })
    .from(policiesTable)
    .where(and(eq(policiesTable.id, policyId), eq(policiesTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!policy) return res.status(404).json({ error: "Not found" });

  const versions = await db
    .select()
    .from(policyVersionsTable)
    .where(eq(policyVersionsTable.policyId, policyId))
    .orderBy(desc(policyVersionsTable.version));
  return res.json(versions);
});

// ============================================================
// Entities (auth-protected, tenant-scoped)
// ============================================================
router.get("/entities", requireAuth, async (req: Request, res: Response) => {
  const { page, limit, offset } = getPagination(req);
  const search = getSearchTerm(req);
  const type = req.query.type as string;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as string) || "desc";

  const conditions = [eq(entitiesTable.organizationId, req.user!.organizationId)];
  if (search) conditions.push(or(ilike(entitiesTable.externalId, `%${search}%`), ilike(entitiesTable.type, `%${search}%`))!);
  if (type) conditions.push(eq(entitiesTable.type, type));

  const orderBy = sortOrder === "asc" ? asc(sortByColumn(entitiesTable, sortBy)) : desc(sortByColumn(entitiesTable, sortBy));

  const baseQuery = db.select().from(entitiesTable).where(and(...conditions)).orderBy(orderBy as any);
  const countQuery = db.select({ value: drizzleCount() }).from(entitiesTable).where(and(...conditions));

  const result = await paginate(baseQuery, countQuery, { page, limit, offset });
  return res.json(result);
});

router.get("/entities/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [entity] = await db
    .select()
    .from(entitiesTable)
    .where(and(eq(entitiesTable.id, id), eq(entitiesTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!entity) return res.status(404).json({ error: "Not found" });
  return res.json(entity);
});

router.patch("/entities/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const parsed = updateEntitySchema.parse(req.body);
  const id = req.params.id as string;
  const [entity] = await db
    .update(entitiesTable)
    .set(parsed)
    .where(and(eq(entitiesTable.id, id), eq(entitiesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!entity) return res.status(404).json({ error: "Not found" });
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "entity.updated",
    targetType: "entity",
    targetId: entity.id,
    metadata: { changedFields: Object.keys(parsed) },
  });
  return res.json(entity);
});

router.delete("/entities/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [entity] = await db
    .delete(entitiesTable)
    .where(and(eq(entitiesTable.id, id), eq(entitiesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!entity) return res.status(404).json({ error: "Not found" });
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "entity.deleted",
    targetType: "entity",
    targetId: entity.id,
    metadata: { externalId: entity.externalId, type: entity.type },
  });
  return res.json({ success: true });
});

router.post("/entities", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const parsed = createEntitySchema.parse(req.body);
  const [entity] = await db.insert(entitiesTable).values({
    ...parsed,
    organizationId: req.user!.organizationId,
  }).returning();
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "entity.created",
    targetType: "entity",
    targetId: entity.id,
    metadata: { externalId: entity.externalId, type: entity.type },
  });
  return res.status(201).json(entity);
});

// ============================================================
// Resources (auth-protected, tenant-scoped)
// ============================================================
router.get("/resources", requireAuth, async (req: Request, res: Response) => {
  const { page, limit, offset } = getPagination(req);
  const search = getSearchTerm(req);
  const type = req.query.type as string;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as string) || "desc";

  const conditions = [eq(resourcesTable.organizationId, req.user!.organizationId)];
  if (search) conditions.push(or(ilike(resourcesTable.name, `%${search}%`), ilike(resourcesTable.description, `%${search}%`), ilike(resourcesTable.type, `%${search}%`))!);
  if (type) conditions.push(eq(resourcesTable.type, type));

  const orderBy = sortOrder === "asc" ? asc(sortByColumn(resourcesTable, sortBy)) : desc(sortByColumn(resourcesTable, sortBy));

  const baseQuery = db.select().from(resourcesTable).where(and(...conditions)).orderBy(orderBy as any);
  const countQuery = db.select({ value: drizzleCount() }).from(resourcesTable).where(and(...conditions));

  const result = await paginate(baseQuery, countQuery, { page, limit, offset });
  return res.json(result);
});

router.get("/resources/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [resource] = await db
    .select()
    .from(resourcesTable)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!resource) return res.status(404).json({ error: "Not found" });
  return res.json(resource);
});

router.patch("/resources/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const parsed = updateResourceSchema.parse(req.body);
  const id = req.params.id as string;
  const [resource] = await db
    .update(resourcesTable)
    .set(parsed)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!resource) return res.status(404).json({ error: "Not found" });
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "resource.updated",
    targetType: "resource",
    targetId: resource.id,
    metadata: { changedFields: Object.keys(parsed) },
  });
  return res.json(resource);
});

router.delete("/resources/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [resource] = await db
    .delete(resourcesTable)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!resource) return res.status(404).json({ error: "Not found" });
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "resource.deleted",
    targetType: "resource",
    targetId: resource.id,
    metadata: { name: resource.name, type: resource.type },
  });
  return res.json({ success: true });
});

router.post("/resources", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const parsed = createResourceSchema.parse(req.body);
  const [resource] = await db.insert(resourcesTable).values({
    ...parsed,
    organizationId: req.user!.organizationId,
  }).returning();
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "resource.created",
    targetType: "resource",
    targetId: resource.id,
    metadata: { name: resource.name, type: resource.type },
  });
  return res.status(201).json(resource);
});

// ============================================================
// Policy Evaluation (auth-protected, org scoped from session)
// ============================================================

function resolveValue(field: string, context: Record<string, unknown>): unknown {
  // Support dot-notation for nested access: "subject.plan" -> context.subject.plan
  const parts = field.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function checkCondition(condition: Record<string, unknown>, context: Record<string, unknown>): boolean {
  const field = condition.field as string;
  const operator = condition.operator as string;
  const expected = condition.value;

  const actual = resolveValue(field, context);

  switch (operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "not_in":
      return Array.isArray(expected) && !expected.includes(actual);
    case "contains":
      return typeof actual === "string" && typeof expected === "string" && actual.includes(expected);
    case "not_contains":
      return typeof actual === "string" && typeof expected === "string" && !actual.includes(expected);
    case "exists":
      return actual !== undefined && actual !== null;
    case "not_exists":
      return actual === undefined || actual === null;
    case "gt":
      return typeof actual === "number" && typeof expected === "number" && actual > expected;
    case "lt":
      return typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "gte":
      return typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "lte":
      return typeof actual === "number" && typeof expected === "number" && actual <= expected;
    default:
      return false;
  }
}

function evaluatePolicies(
  policies: Array<{ id: string; effect: string; priority: number; conditions: Record<string, unknown>[]; active: boolean }>,
  context: Record<string, unknown>,
): { decision: string; reason: string; matchedPolicyId: string | null } {
  // Only active policies, sorted by priority descending
  const activePolicies = policies
    .filter((p) => p.active)
    .sort((a, b) => b.priority - a.priority);

  for (const policy of activePolicies) {
    // Check all conditions - ALL must match for the policy to apply
    const allMatch = policy.conditions.every((c) => checkCondition(c as Record<string, unknown>, context));
    if (allMatch) {
      return {
        decision: policy.effect,
        reason: `Matched policy: ${policy.id} (priority ${policy.priority})`,
        matchedPolicyId: policy.id,
      };
    }
  }

  // Default deny when no policy matches
  return { decision: "deny", reason: "No matching allow policy found", matchedPolicyId: null };
}

router.get("/decisions", requireAuth, async (req: Request, res: Response) => {
  const { page, limit, offset } = getPagination(req);
  const search = getSearchTerm(req);
  const entityId = req.query.entityId as string;
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;
  const resourceType = req.query.resourceType as string;
  const decision = req.query.decision as string;
  const since = req.query.since as string;
  const until = req.query.until as string;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as string) || "desc";

  const conditions = [eq(decisionLogsTable.organizationId, req.user!.organizationId)];
  if (search) conditions.push(or(
    ilike(decisionLogsTable.entityId, `%${search}%`),
    ilike(decisionLogsTable.resourceId, `%${search}%`),
    ilike(decisionLogsTable.requestId, `%${search}%`)
  )!);
  if (entityId) conditions.push(eq(decisionLogsTable.entityId, entityId));
  if (entityType) conditions.push(eq(decisionLogsTable.entityType, entityType));
  if (action) conditions.push(eq(decisionLogsTable.action, action));
  if (resourceType) conditions.push(eq(decisionLogsTable.resourceType, resourceType));
  if (decision && ["allow", "deny"].includes(decision)) conditions.push(eq(decisionLogsTable.decision, decision));
  if (since) conditions.push(sql`${decisionLogsTable.createdAt} >= ${since}`);
  if (until) conditions.push(sql`${decisionLogsTable.createdAt} <= ${until}`);

  const orderBy = sortOrder === "asc" ? asc(sortByColumn(decisionLogsTable, sortBy)) : desc(sortByColumn(decisionLogsTable, sortBy));

  const baseQuery = db.select().from(decisionLogsTable).where(and(...conditions)).orderBy(orderBy as any);
  const countQuery = db.select({ value: drizzleCount() }).from(decisionLogsTable).where(and(...conditions));

  const result = await paginate(baseQuery, countQuery, { page, limit, offset });
  return res.json(result);
});

router.post("/decisions/evaluate", requireAuth, async (req: Request, res: Response) => {
  const { entity, action, resource } = req.body;
  const organizationId = req.user!.organizationId;
  const start = Date.now();

  try {
    // Fetch policies: those assigned to the entity UNION unassigned (org-wide) policies
    const entityId = entity?.id;
    let resolvedPolicies: typeof policiesTable.$inferSelect[] = [];

    if (entityId) {
      // Find policy IDs with no assignments (org-wide defaults)
      const unassigned = await db
        .select({ id: policiesTable.id })
        .from(policiesTable)
        .leftJoin(policyAssignmentsTable, eq(policiesTable.id, policyAssignmentsTable.policyId))
        .where(and(
          eq(policiesTable.organizationId, organizationId),
          eq(policiesTable.active, true),
          isNull(policyAssignmentsTable.policyId),
        ));

      // Find policies explicitly assigned to this entity
      const assigned = await db
        .select({ policyId: policyAssignmentsTable.policyId })
        .from(policyAssignmentsTable)
        .where(eq(policyAssignmentsTable.entityId, entityId));

      const allPolicyIds = [
        ...unassigned.map(p => p.id),
        ...assigned.map(a => a.policyId).filter(Boolean) as string[],
      ];

      if (allPolicyIds.length > 0) {
        resolvedPolicies = await db
          .select()
          .from(policiesTable)
          .where(inArray(policiesTable.id, allPolicyIds as string[]))
          .orderBy(desc(policiesTable.priority));
      }
    } else {
      // No entity specified — fetch all org-wide active policies with no assignments
      const unassigned = await db
        .select({ id: policiesTable.id })
        .from(policiesTable)
        .leftJoin(policyAssignmentsTable, eq(policiesTable.id, policyAssignmentsTable.policyId))
        .where(and(
          eq(policiesTable.organizationId, organizationId),
          eq(policiesTable.active, true),
          isNull(policyAssignmentsTable.policyId),
        ));

      const ids = unassigned.map(p => p.id);
      if (ids.length > 0) {
        resolvedPolicies = await db
          .select()
          .from(policiesTable)
          .where(inArray(policiesTable.id, ids))
          .orderBy(desc(policiesTable.priority));
      }
    }

    // Build evaluation context from entity attributes, resource attributes, and action
    const context: Record<string, unknown> = {
      // Entity context
      "entity.id": entity?.id,
      "entity.type": entity?.type,
      "entity.attributes": entity?.attributes,
      // Flatten entity attributes for dot-notation access
      ...entity?.attributes,
      // Subject aliases
      "subject.id": entity?.id,
      "subject.type": entity?.type,
      "subject.attributes": entity?.attributes,
      ...entity?.attributes,
      // Action context
      action,
      // Resource context
      "resource.id": resource?.id,
      "resource.type": resource?.type,
      "resource.attributes": resource?.attributes,
      "resource.owner_id": resource?.attributes?.owner_id,
    };

    const result = evaluatePolicies(
      resolvedPolicies as unknown as Array<{ id: string; effect: string; priority: number; conditions: Record<string, unknown>[]; active: boolean }>,
      context,
    );

    const latencyMs = Date.now() - start;

    // Log the decision
    if (entity?.id && organizationId) {
      const logEntry = insertDecisionLogSchema.parse({
        requestId: randomUUID(),
        entityId: entity.id,
        entityType: entity.type || "unknown",
        action: action || "unknown",
        resourceType: resource?.type || "unknown",
        resourceId: resource?.id || null,
        decision: result.decision,
        reason: result.reason,
        context: { entity, action, resource },
        latencyMs,
        organizationId,
        matchedPolicyId: result.matchedPolicyId,
      });
      await db.insert(decisionLogsTable).values(logEntry);
    }

    return res.json({
      decision: result.decision,
      reason: result.reason,
      matchedPolicy: result.matchedPolicyId,
      latencyMs,
    });
  } catch (e) {
    return res.status(500).json({ error: "Evaluation failed" });
  }
});

// ============================================================
// API Keys (auth-protected, tenant-scoped)
// ============================================================
router.get("/api-keys", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const { page, limit, offset } = getPagination(req);
  const search = getSearchTerm(req);
  const includeRevoked = req.query.includeRevoked === "true";
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as string) || "desc";

  const conditions = [eq(apiKeysTable.organizationId, req.user!.organizationId)];
  if (!includeRevoked) conditions.push(isNull(apiKeysTable.revokedAt));
  if (search) conditions.push(or(ilike(apiKeysTable.name, `%${search}%`), ilike(apiKeysTable.prefix, `%${search}%`))!);

  const orderBy = sortOrder === "asc" ? asc(sortByColumn(apiKeysTable, sortBy)) : desc(sortByColumn(apiKeysTable, sortBy));

  const baseQuery = db.select().from(apiKeysTable).where(and(...conditions)).orderBy(orderBy as any);
  const countQuery = db.select({ value: drizzleCount() }).from(apiKeysTable).where(and(...conditions));

  const result = await paginate(baseQuery, countQuery, { page, limit, offset });
  return res.json(result);
});

router.post("/api-keys", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const parsed = createApiKeySchema.parse(req.body);
  const rawKey = `ak_${randomUUID()}`;
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 8);
  const [key] = await db.insert(apiKeysTable).values({
    ...parsed,
    hashedKey,
    prefix,
    organizationId: req.user!.organizationId,
    createdById: req.user!.id,
  }).returning();
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "api_key.created",
    targetType: "api_key",
    targetId: key.id,
    metadata: { name: key.name, prefix: key.prefix },
  });
  // Return the raw key only once (on creation)
  return res.status(201).json({ ...key, key: rawKey });
});

router.get("/api-keys/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [key] = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!key) return res.status(404).json({ error: "Not found" });
  return res.json(key);
});

router.delete("/api-keys/:id", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [key] = await db
      .update(apiKeysTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.organizationId, req.user!.organizationId)))
      .returning();
    if (!key) return res.status(404).json({ error: "Not found" });
    logAuditEvent({
      organizationId: req.user!.organizationId,
      actorId: req.user!.id,
      action: "api_key.revoked",
      targetType: "api_key",
      targetId: key.id,
      metadata: { name: key.name, prefix: key.prefix },
    });
    return res.json({ success: true, revokedAt: key.revokedAt });
  } catch (error) {
    return res.status(500).json({ error: { message: "Failed to revoke API key" } });
  }
});

// ============================================================
// Team / Members (admin-only for mutating)
// ============================================================
router.get("/team", requireAuth, async (req: Request, res: Response) => {
  const orgId = req.user!.organizationId;
  const members = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.organizationId, orgId), isNull(usersTable.deletedAt)))
    .orderBy(usersTable.name);
  return res.json(members);
});

// Team invitations now live under /api/invitations (see routes/invitations.ts).

router.patch("/team/:id", requireAuth, requireTeamManager, async (req: Request, res: Response) => {
  try {
    const memberId = req.params.id as string;
    const role = typeof req.body.role === "string" ? req.body.role : "";
    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ error: { message: "Role must be owner, admin, or member" } });
    }
    const [currentMember] = await db
      .select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, memberId),
        eq(usersTable.organizationId, req.user!.organizationId),
        isNull(usersTable.deletedAt),
      ))
      .limit(1);
    if (!currentMember) return res.status(404).json({ error: "Not found" });
    if (req.user!.role !== "owner" && (currentMember.role === "owner" || role === "owner")) {
      return res.status(403).json({ error: { message: "Only organization owners can change owner roles" } });
    }
    if (currentMember.role === "owner" && role !== "owner") {
      const [{ value: ownerCount }] = await db
        .select({ value: drizzleCount() })
        .from(usersTable)
        .where(and(
          eq(usersTable.organizationId, req.user!.organizationId),
          eq(usersTable.role, "owner"),
          isNull(usersTable.deletedAt),
        ));
      if (Number(ownerCount) <= 1) {
        return res.status(409).json({ error: { message: "Transfer ownership before changing the last owner’s role" } });
      }
    }
    const [member] = await db
      .update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, memberId))
      .returning();
    logAuditEvent({
      organizationId: req.user!.organizationId,
      actorId: req.user!.id,
      action: "member.role_updated",
      targetType: "member",
      targetId: member.id,
      metadata: { email: member.email, role: member.role },
    });
    return res.json(member);
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message || "Invalid request" } });
  }
});

router.delete("/team/:id", requireAuth, requireTeamManager, async (req: Request, res: Response) => {
  const memberId = req.params.id as string;
  if (memberId === req.user!.id) {
    return res.status(400).json({ error: { message: "Use account deletion to remove your own account" } });
  }
  const [member] = await db
    .select()
    .from(usersTable)
    .where(and(
      eq(usersTable.id, memberId),
      eq(usersTable.organizationId, req.user!.organizationId),
      isNull(usersTable.deletedAt),
    ))
    .limit(1);
  if (!member) return res.status(404).json({ error: "Not found" });
  if (req.user!.role !== "owner" && member.role === "owner") {
    return res.status(403).json({ error: { message: "Only organization owners can remove an owner" } });
  }
  if (member.role === "owner") {
    const [{ value: ownerCount }] = await db
      .select({ value: drizzleCount() })
      .from(usersTable)
      .where(and(
        eq(usersTable.organizationId, req.user!.organizationId),
        eq(usersTable.role, "owner"),
        isNull(usersTable.deletedAt),
      ));
    if (Number(ownerCount) <= 1) {
      return res.status(409).json({ error: { message: "Transfer ownership before removing the last owner" } });
    }
  }
  await db.transaction(async (tx) => {
    await tx.delete(sessionsTable).where(eq(sessionsTable.userId, member.id));
    await tx.update(apiKeysTable).set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(apiKeysTable.createdById, member.id), isNull(apiKeysTable.revokedAt)));
    await tx.delete(usersTable).where(eq(usersTable.id, member.id));
  });
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "member.removed",
    targetType: "member",
    targetId: member.id,
    metadata: { email: member.email, role: member.role },
  });
  return res.json({ success: true });
});

// ============================================================
// v1 Evaluate endpoint (for API key auth)
// ============================================================
router.post("/v1/evaluate", async (req: Request, res: Response) => {
  const { entity, action, resource } = req.body;
  const start = Date.now();

  // Authenticate via API key in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "API key required (Authorization: Bearer ak_...)" });
  }

  const rawKey = authHeader.slice(7);
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");

  const [apiKey] = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.hashedKey, hashedKey), isNull(apiKeysTable.revokedAt)))
    .limit(1);

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid or revoked API key" });
  }

  const organizationId = apiKey.organizationId;

  try {
    // Fetch all active policies for the organization
    let resolvedPolicies: typeof policiesTable.$inferSelect[] = [];

    const unassigned = await db
      .select({ id: policiesTable.id })
      .from(policiesTable)
      .leftJoin(policyAssignmentsTable, eq(policiesTable.id, policyAssignmentsTable.policyId))
      .where(and(
        eq(policiesTable.organizationId, organizationId),
        eq(policiesTable.active, true),
        isNull(policyAssignmentsTable.policyId),
      ));

    const ids = [...new Set(unassigned.map(p => p.id))] as string[];
    if (ids.length > 0) {
      resolvedPolicies = await db
        .select()
        .from(policiesTable)
        .where(inArray(policiesTable.id, ids))
        .orderBy(desc(policiesTable.priority));
    }

    const context: Record<string, unknown> = {
      "entity.id": entity?.id,
      "entity.type": entity?.type,
      "entity.attributes": entity?.attributes,
      ...entity?.attributes,
      "subject.id": entity?.id,
      "subject.type": entity?.type,
      "subject.attributes": entity?.attributes,
      ...entity?.attributes,
      action,
      "resource.id": resource?.id,
      "resource.type": resource?.type,
      "resource.attributes": resource?.attributes,
      "resource.owner_id": resource?.attributes?.owner_id,
    };

    const result = evaluatePolicies(
      resolvedPolicies as unknown as Array<{ id: string; effect: string; priority: number; conditions: Record<string, unknown>[]; active: boolean }>,
      context,
    );

    const latencyMs = Date.now() - start;

    return res.json({
      decision: result.decision,
      reason: result.reason,
      matchedPolicy: result.matchedPolicyId,
      latencyMs,
    });
  } catch (e) {
    return res.status(500).json({ error: "Evaluation failed" });
  }
});

// ============================================================
// Policy Assignments (auth-protected, tenant-scoped)
// ============================================================
async function requireOrganizationEntity(entityId: string, organizationId: string) {
  const [entity] = await db
    .select({ id: entitiesTable.id })
    .from(entitiesTable)
    .where(and(eq(entitiesTable.id, entityId), eq(entitiesTable.organizationId, organizationId)))
    .limit(1);
  return entity;
}

router.get("/entities/:id/policies", requireAuth, async (req: Request, res: Response) => {
  const entityId = req.params.id as string;
  const entity = await requireOrganizationEntity(entityId, req.user!.organizationId);
  if (!entity) return res.status(404).json({ error: "Not found" });

  const assignments = await db
    .select()
    .from(policyAssignmentsTable)
    .where(eq(policyAssignmentsTable.entityId, entityId));
  return res.json(assignments);
});

router.post("/entities/:id/policies", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const { policyId } = req.body;
  const entityId = req.params.id as string;
  if (typeof policyId !== "string" || !policyId) {
    return res.status(400).json({ error: "policyId is required" });
  }

  const [entity, policy] = await Promise.all([
    requireOrganizationEntity(entityId, req.user!.organizationId),
    db.select({ id: policiesTable.id })
      .from(policiesTable)
      .where(and(eq(policiesTable.id, policyId), eq(policiesTable.organizationId, req.user!.organizationId)))
      .limit(1)
      .then(([result]) => result),
  ]);
  if (!entity || !policy) {
    return res.status(404).json({ error: "Entity or policy not found in your organization" });
  }

  const [assignment] = await db
    .insert(policyAssignmentsTable)
    .values({ entityId, policyId })
    .onConflictDoNothing()
    .returning();

  if (assignment) {
    logAuditEvent({
      organizationId: req.user!.organizationId,
      actorId: req.user!.id,
      action: "policy.assigned",
      targetType: "policy_assignment",
      targetId: assignment.id,
      metadata: { entityId, policyId },
    });
  }
  return res.status(201).json(assignment || { success: true });
});

router.delete("/entities/:id/policies/:policyId", requireAuth, requireWorkspaceManager, async (req: Request, res: Response) => {
  const entityId = req.params.id as string;
  const policyId = req.params.policyId as string;
  const [entity, policy] = await Promise.all([
    requireOrganizationEntity(entityId, req.user!.organizationId),
    db.select({ id: policiesTable.id })
      .from(policiesTable)
      .where(and(eq(policiesTable.id, policyId), eq(policiesTable.organizationId, req.user!.organizationId)))
      .limit(1)
      .then(([result]) => result),
  ]);
  if (!entity || !policy) return res.status(404).json({ error: "Not found" });

  const [assignment] = await db
    .delete(policyAssignmentsTable)
    .where(and(
      eq(policyAssignmentsTable.entityId, entityId),
      eq(policyAssignmentsTable.policyId, policyId),
    ))
    .returning();
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });
  logAuditEvent({
    organizationId: req.user!.organizationId,
    actorId: req.user!.id,
    action: "policy.unassigned",
    targetType: "policy_assignment",
    targetId: assignment.id,
    metadata: { entityId, policyId },
  });
  return res.json({ success: true });
});

// ============================================================
// Billing / Subscription (requires STRIPE_SECRET_KEY)
// ============================================================
const createCheckoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

router.get("/billing/subscription", requireAuth, requireOwner, async (req: Request, res: Response) => {
  try {
    const st = await getStripe();
    if (!st) return res.status(503).json({ error: { message: "Billing not configured" } });

    const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, req.user!.organizationId)).limit(1);
    if (!org || !org.stripeCustomerId) {
      return res.json({ data: null });
    }

    const subscriptions = await st.subscriptions.list({ customer: org.stripeCustomerId, status: "all", limit: 1 });
    const sub = subscriptions.data[0] || null;
    return res.json({ data: sub });
  } catch (error: any) {
    return res.status(500).json({ error: { message: error.message || "Billing error" } });
  }
});

router.post("/billing/checkout", requireAuth, requireOwner, async (req: Request, res: Response) => {
  try {
    const st = await getStripe();
    if (!st) return res.status(503).json({ error: { message: "Billing not configured" } });

    const parsed = createCheckoutSchema.parse(req.body);
    const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, req.user!.organizationId)).limit(1);
    if (!org) return res.status(404).json({ error: { message: "Organization not found" } });

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await st.customers.create({ email: req.user!.email, name: org.name, metadata: { organizationId: org.id } });
      customerId = customer.id;
      await db.update(organizationsTable).set({ stripeCustomerId: customerId }).where(eq(organizationsTable.id, org.id));
    }

    const session = await st.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: parsed.priceId, quantity: 1 }],
      success_url: parsed.successUrl || `${process.env.FRONTEND_URL}/settings/billing?success=true`,
      cancel_url: parsed.cancelUrl || `${process.env.FRONTEND_URL}/settings/billing?canceled=true`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { organizationId: org.id } },
    });

    return res.json({ data: { url: session.url } });
  } catch (error: any) {
    return res.status(400).json({ error: { message: error.message || "Checkout failed" } });
  }
});

router.post("/billing/portal", requireAuth, requireOwner, async (req: Request, res: Response) => {
  try {
    const st = await getStripe();
    if (!st) return res.status(503).json({ error: { message: "Billing not configured" } });

    const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, req.user!.organizationId)).limit(1);
    if (!org || !org.stripeCustomerId) {
      return res.status(404).json({ error: { message: "No billing account found" } });
    }

    const session = await st.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/settings/billing`,
    });

    return res.json({ data: { url: session.url } });
  } catch (error: any) {
    return res.status(500).json({ error: { message: error.message || "Portal error" } });
  }
});

router.post("/billing/webhook", async (req: Request, res: Response) => {
  try {
    const st = await getStripe();
    if (!st || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: { message: "Webhook not configured" } });
    }

    const sig = req.headers["stripe-signature"] as string;
    const event = st.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;
      const orgId = subscription.metadata?.organizationId;
      if (orgId) {
        await db.update(organizationsTable).set({
          stripeSubscriptionId: subscription.id,
          stripeStatus: subscription.status,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }).where(eq(organizationsTable.id, orgId));
      }
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(400).json({ error: { message: `Webhook error: ${error.message}` } });
  }
});

// ============================================================
// Validation schemas for conditions, policies, API keys
// ============================================================
const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["equals", "not_equals", "in", "not_in", "contains", "not_contains", "exists", "not_exists", "gt", "lt", "gte", "lte"]),
  value: z.unknown(),
});

const policyConditionsSchema = z.array(conditionSchema);

const createPolicySchema = insertPolicySchema
  .omit({ organizationId: true })
  .extend({
    conditions: policyConditionsSchema,
  });

const updatePolicySchema = createInsertSchema(policiesTable)
  .partial()
  .omit({ id: true, organizationId: true, createdAt: true, updatedAt: true, version: true })
  .extend({ conditions: policyConditionsSchema.optional() });

const createEntitySchema = insertEntitySchema.omit({ organizationId: true });

const createResourceSchema = insertResourceSchema.omit({ organizationId: true });

const createApiKeySchema = insertApiKeySchema
  .omit({ organizationId: true, createdById: true, hashedKey: true, prefix: true, revokedAt: true, lastUsedAt: true })
  .extend({
    name: z.string().min(1).max(100),
    expiresAt: z.coerce.date().optional().nullable(),
  });

export default router;
