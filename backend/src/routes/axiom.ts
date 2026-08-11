import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import {
  organizationsTable,
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
import { randomUUID, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { Policy, Entity, Resource, ApiKey } from "@workspace/db/schema";

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
      .where(eq(usersTable.id, session.userId))
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
    };
    next();
  } catch (error) {
    res.status(500).json({ error: { message: "Auth check failed" } });
  }
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
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: expiresAt,
  });
  return token;
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
router.post("/auth/sign-in", authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: "Email and password required" } });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    await createSession(user.id, res);

    return res.json({ data: { user: { id: user.id, email: user.email, name: user.name } } });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

router.post("/auth/sign-up", signupRateLimit, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: { message: "Name, email, and password required" } });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: { message: "Password must be at least 8 characters" } });
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) {
      return res.status(409).json({ error: { message: "Email already in use" } });
    }

    // Create default org + user
    const orgId = randomUUID();
    await db.insert(organizationsTable).values({
      id: orgId,
      name: `${name}'s Org`,
      slug: `org-${randomUUID().slice(0, 8)}`,
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      name,
      email,
      passwordHash,
      organizationId: orgId,
    });

    await createSession(userId, res);

    return res.json({ data: { user: { id: userId, email, name } } });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

router.post("/auth/sign-out", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.session_token;
    if (token) {
      await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
      res.clearCookie("session_token");
    }
    return res.json({ data: null });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
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
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    if (!user) {
      return res.json({ data: null });
    }

    return res.json({ data: { user: { id: user.id, email: user.email, name: user.name } } });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

// ============================================================
// User Profile & Auth (auth-protected)
// ============================================================
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

router.patch("/organizations/:id", requireAuth, async (req: Request, res: Response) => {
  if (req.params.id !== req.user!.organizationId) {
    return res.status(403).json({ error: "Access denied" });
  }
  const parsed = updateOrganizationSchema.parse(req.body);
  const [org] = await db.update(organizationsTable).set(parsed).where(eq(organizationsTable.id, req.params.id)).returning();
  if (!org) return res.status(404).json({ error: "Not found" });
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

router.post("/policies", requireAuth, async (req: Request, res: Response) => {
  const parsed = createPolicySchema.parse(req.body);
  const [policy] = await db.insert(policiesTable).values({
    ...parsed,
    organizationId: req.user!.organizationId,
  }).returning();
  return res.json(policy);
});

router.patch("/policies/:id", requireAuth, async (req: Request, res: Response) => {
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
  return res.json(policy);
});

router.delete("/policies/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [policy] = await db
      .delete(policiesTable)
      .where(and(eq(policiesTable.id, id), eq(policiesTable.organizationId, req.user!.organizationId)))
      .returning();
    if (!policy) return res.status(404).json({ error: "Not found" });
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

router.patch("/entities/:id", requireAuth, async (req: Request, res: Response) => {
  const parsed = updateEntitySchema.parse(req.body);
  const id = req.params.id as string;
  const [entity] = await db
    .update(entitiesTable)
    .set(parsed)
    .where(and(eq(entitiesTable.id, id), eq(entitiesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!entity) return res.status(404).json({ error: "Not found" });
  return res.json(entity);
});

router.delete("/entities/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [entity] = await db
    .delete(entitiesTable)
    .where(and(eq(entitiesTable.id, id), eq(entitiesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!entity) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true });
});

router.post("/entities", requireAuth, async (req: Request, res: Response) => {
  const parsed = createEntitySchema.parse(req.body);
  const [entity] = await db.insert(entitiesTable).values({
    ...parsed,
    organizationId: req.user!.organizationId,
  }).returning();
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

router.patch("/resources/:id", requireAuth, async (req: Request, res: Response) => {
  const parsed = updateResourceSchema.parse(req.body);
  const id = req.params.id as string;
  const [resource] = await db
    .update(resourcesTable)
    .set(parsed)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!resource) return res.status(404).json({ error: "Not found" });
  return res.json(resource);
});

router.delete("/resources/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [resource] = await db
    .delete(resourcesTable)
    .where(and(eq(resourcesTable.id, id), eq(resourcesTable.organizationId, req.user!.organizationId)))
    .returning();
  if (!resource) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true });
});

router.post("/resources", requireAuth, async (req: Request, res: Response) => {
  const parsed = createResourceSchema.parse(req.body);
  const [resource] = await db.insert(resourcesTable).values({
    ...parsed,
    organizationId: req.user!.organizationId,
  }).returning();
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
router.get("/api-keys", requireAuth, async (req: Request, res: Response) => {
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

router.post("/api-keys", requireAuth, async (req: Request, res: Response) => {
  const parsed = createApiKeySchema.parse(req.body);
  const rawKey = `ak_${randomUUID()}`;
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 8);
  const [key] = await db.insert(apiKeysTable).values({
    ...parsed,
    hashedKey,
    prefix,
    organizationId: req.user!.organizationId,
  }).returning();
  // Return the raw key only once (on creation)
  return res.status(201).json({ ...key, key: rawKey });
});

router.get("/api-keys/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const [key] = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!key) return res.status(404).json({ error: "Not found" });
  return res.json(key);
});

router.delete("/api-keys/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [key] = await db
      .update(apiKeysTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.organizationId, req.user!.organizationId)))
      .returning();
    if (!key) return res.status(404).json({ error: "Not found" });
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
  const members = await db.select().from(usersTable).where(eq(usersTable.organizationId, orgId)).orderBy(usersTable.name);
  return res.json(members);
});

// Team invitations now live under /api/invitations (see routes/invitations.ts).

router.patch("/team/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const memberId = req.params.id as string;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: { message: "Role is required" } });
    const [member] = await db.update(usersTable).set({ role, updatedAt: new Date() }).where(and(eq(usersTable.id, memberId), eq(usersTable.organizationId, req.user!.organizationId))).returning();
    if (!member) return res.status(404).json({ error: "Not found" });
    return res.json(member);
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message || "Invalid request" } });
  }
});

router.delete("/team/:id", requireAuth, async (req: Request, res: Response) => {
  const memberId = req.params.id as string;
  const [member] = await db.delete(usersTable).where(and(eq(usersTable.id, memberId), eq(usersTable.organizationId, req.user!.organizationId))).returning();
  if (!member) return res.status(404).json({ error: "Not found" });
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
router.get("/entities/:id/policies", requireAuth, async (req: Request, res: Response) => {
  const entityId = req.params.id as string;
  const assignments = await db
    .select()
    .from(policyAssignmentsTable)
    .where(eq(policyAssignmentsTable.entityId, entityId));
  return res.json(assignments);
});

router.post("/entities/:id/policies", requireAuth, async (req: Request, res: Response) => {
  const { policyId } = req.body;
  const entityId = req.params.id as string;
  if (!policyId) {
    return res.status(400).json({ error: "policyId is required" });
  }

  // Verify policy belongs to user's org
  const [policy] = await db
    .select()
    .from(policiesTable)
    .where(and(eq(policiesTable.id, policyId), eq(policiesTable.organizationId, req.user!.organizationId)))
    .limit(1);
  if (!policy) {
    return res.status(404).json({ error: "Policy not found in your organization" });
  }

  const [assignment] = await db
    .insert(policyAssignmentsTable)
    .values({ entityId, policyId })
    .onConflictDoNothing()
    .returning();

  return res.status(201).json(assignment || { success: true });
});

router.delete("/entities/:id/policies/:policyId", requireAuth, async (req: Request, res: Response) => {
  const entityId = req.params.id as string;
  const policyId = req.params.policyId as string;
  const [assignment] = await db
    .delete(policyAssignmentsTable)
    .where(and(
      eq(policyAssignmentsTable.entityId, entityId),
      eq(policyAssignmentsTable.policyId, policyId),
    ))
    .returning();
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });
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

router.get("/billing/subscription", requireAuth, async (req: Request, res: Response) => {
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

router.post("/billing/checkout", requireAuth, async (req: Request, res: Response) => {
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

router.post("/billing/portal", requireAuth, async (req: Request, res: Response) => {
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
  .omit({ organizationId: true, hashedKey: true, prefix: true, revokedAt: true, lastUsedAt: true })
  .extend({
    name: z.string().min(1).max(100),
    expiresAt: z.coerce.date().optional().nullable(),
  });

export default router;
