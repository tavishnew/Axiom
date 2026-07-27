import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  organizationsTable,
  policiesTable,
  entitiesTable,
  resourcesTable,
  decisionLogsTable,
  apiKeysTable,
  usersTable,
  insertPolicySchema,
  insertEntitySchema,
  insertResourceSchema,
  insertDecisionLogSchema,
  insertOrganizationSchema,
  insertApiKeySchema,
  insertUserSchema,
} from "@workspace/db/schema";
import { eq, desc, and, ilike, count as drizzleCount } from "drizzle-orm";
import { randomUUID, createHash } from "crypto";
import type { Policy, Entity, Resource, ApiKey } from "@workspace/db/schema";

const router: IRouter = Router();

// ============================================================
// Auth endpoints (simplified)
// ============================================================
router.post("/auth/sign-in", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    return res.json({ data: { user: { id: user.id, email: user.email, name: user.name } } });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

router.post("/auth/sign-up", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

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

    const userId = randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      name,
      email,
      organizationId: orgId,
    });

    return res.json({ data: { user: { id: userId, email, name } } });
  } catch (error) {
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
});

router.post("/auth/sign-out", (_req: Request, res: Response) => {
  return res.json({ data: null });
});

// ============================================================
// Organizations
// ============================================================
router.get("/organizations", async (_req: Request, res: Response) => {
  const orgs = await db.select().from(organizationsTable);
  return res.json(orgs);
});

router.get("/organizations/:id", async (req: Request, res: Response) => {
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, req.params.id)).limit(1);
  if (!org) return res.status(404).json({ error: "Not found" });
  return res.json(org);
});

router.patch("/organizations/:id", async (req: Request, res: Response) => {
  const [org] = await db.update(organizationsTable).set(req.body).where(eq(organizationsTable.id, req.params.id)).returning();
  if (!org) return res.status(404).json({ error: "Not found" });
  return res.json(org);
});

router.post("/organizations", async (req: Request, res: Response) => {
  const parsed = insertOrganizationSchema.parse(req.body);
  const [org] = await db.insert(organizationsTable).values(parsed).returning();
  return res.status(201).json(org);
});

// ============================================================
// Policies
// ============================================================
router.get("/policies", async (_req: Request, res: Response) => {
  const policies = await db.select().from(policiesTable).orderBy(desc(policiesTable.priority));
  return res.json(policies);
});

router.get("/policies/:id", async (req: Request, res: Response) => {
  const [policy] = await db.select().from(policiesTable).where(eq(policiesTable.id, req.params.id)).limit(1);
  if (!policy) return res.status(404).json({ error: "Not found" });
  return res.json(policy);
});

router.post("/policies", async (req: Request, res: Response) => {
  const parsed = insertPolicySchema.parse(req.body);
  const [policy] = await db.insert(policiesTable).values(parsed).returning();
  return res.json(policy);
});

router.patch("/policies/:id", async (req: Request, res: Response) => {
  const [policy] = await db
    .update(policiesTable)
    .set(req.body)
    .where(eq(policiesTable.id, req.params.id))
    .returning();
  return res.json(policy);
});

router.delete("/policies/:id", async (req: Request, res: Response) => {
  await db.delete(policiesTable).where(eq(policiesTable.id, req.params.id));
  return res.json({ success: true });
});

// ============================================================
// Entities
// ============================================================
router.get("/entities", async (_req: Request, res: Response) => {
  const limit = Math.min(parseInt(_req.query.limit as string) || 50, 100);
  const items = await db.select().from(entitiesTable).orderBy(desc(entitiesTable.createdAt)).limit(limit);
  return res.json(items);
});

router.get("/entities/:id", async (req: Request, res: Response) => {
  const [entity] = await db.select().from(entitiesTable).where(eq(entitiesTable.id, req.params.id)).limit(1);
  if (!entity) return res.status(404).json({ error: "Not found" });
  return res.json(entity);
});

router.patch("/entities/:id", async (req: Request, res: Response) => {
  const [entity] = await db.update(entitiesTable).set(req.body).where(eq(entitiesTable.id, req.params.id)).returning();
  if (!entity) return res.status(404).json({ error: "Not found" });
  return res.json(entity);
});

router.delete("/entities/:id", async (req: Request, res: Response) => {
  const [entity] = await db.delete(entitiesTable).where(eq(entitiesTable.id, req.params.id)).returning();
  if (!entity) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true });
});

router.post("/entities", async (req: Request, res: Response) => {
  const parsed = insertEntitySchema.parse(req.body);
  const [entity] = await db.insert(entitiesTable).values(parsed).returning();
  return res.status(201).json(entity);
});

// ============================================================
// Resources
// ============================================================
router.get("/resources", async (_req: Request, res: Response) => {
  const limit = Math.min(parseInt(_req.query.limit as string) || 50, 100);
  const items = await db.select().from(resourcesTable).orderBy(desc(resourcesTable.createdAt)).limit(limit);
  return res.json(items);
});

router.get("/resources/:id", async (req: Request, res: Response) => {
  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, req.params.id)).limit(1);
  if (!resource) return res.status(404).json({ error: "Not found" });
  return res.json(resource);
});

router.patch("/resources/:id", async (req: Request, res: Response) => {
  const [resource] = await db.update(resourcesTable).set(req.body).where(eq(resourcesTable.id, req.params.id)).returning();
  if (!resource) return res.status(404).json({ error: "Not found" });
  return res.json(resource);
});

router.delete("/resources/:id", async (req: Request, res: Response) => {
  const [resource] = await db.delete(resourcesTable).where(eq(resourcesTable.id, req.params.id)).returning();
  if (!resource) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true });
});

router.post("/resources", async (req: Request, res: Response) => {
  const parsed = insertResourceSchema.parse(req.body);
  const [resource] = await db.insert(resourcesTable).values(parsed).returning();
  return res.status(201).json(resource);
});

// ============================================================
// Policy Evaluation
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

router.get("/decisions", async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const items = await db
    .select()
    .from(decisionLogsTable)
    .orderBy(desc(decisionLogsTable.createdAt))
    .limit(limit);
  return res.json(items);
});

router.post("/decisions/evaluate", async (req: Request, res: Response) => {
  const { entity, action, resource, organizationId } = req.body;
  const start = Date.now();

  if (!organizationId) {
    return res.status(400).json({ error: "organizationId is required" });
  }

  try {
    // Fetch all active policies for the organization
    const policies = await db
      .select()
      .from(policiesTable)
      .where(and(eq(policiesTable.organizationId, organizationId), eq(policiesTable.active, true)))
      .orderBy(desc(policiesTable.priority));

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
      policies as unknown as Array<{ id: string; effect: string; priority: number; conditions: Record<string, unknown>[]; active: boolean }>,
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
// API Keys
// ============================================================
router.get("/api-keys", async (_req: Request, res: Response) => {
  const keys = await db.select().from(apiKeysTable);
  return res.json(keys);
});

router.post("/api-keys", async (req: Request, res: Response) => {
  const parsed = insertApiKeySchema.parse(req.body);
  // Hash the API key before storing
  const rawKey = `ak_${randomUUID()}`;
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 8);
  const [key] = await db.insert(apiKeysTable).values({
    ...parsed,
    hashedKey,
    prefix,
  }).returning();
  // Return the raw key only once (on creation)
  return res.status(201).json({ ...key, key: rawKey });
});

router.get("/api-keys/:id", async (req: Request, res: Response) => {
  const [key] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.id, req.params.id)).limit(1);
  if (!key) return res.status(404).json({ error: "Not found" });
  return res.json(key);
});

router.delete("/api-keys/:id", async (req: Request, res: Response) => {
  const [key] = await db.delete(apiKeysTable).where(eq(apiKeysTable.id, req.params.id)).returning();
  if (!key) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true });
});

// ============================================================
// v1 Evaluate endpoint (for API key auth)
// ============================================================
router.post("/v1/evaluate", async (req: Request, res: Response) => {
  const { entity, action, resource, organizationId } = req.body;
  const start = Date.now();

  if (!organizationId) {
    return res.status(400).json({ error: "organizationId is required" });
  }

  try {
    // Fetch all active policies for the organization
    const policies = await db
      .select()
      .from(policiesTable)
      .where(and(eq(policiesTable.organizationId, organizationId), eq(policiesTable.active, true)))
      .orderBy(desc(policiesTable.priority));

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
      policies as unknown as Array<{ id: string; effect: string; priority: number; conditions: Record<string, unknown>[]; active: boolean }>,
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

export default router;
