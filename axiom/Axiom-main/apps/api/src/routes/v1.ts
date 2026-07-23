// API v1 Routes
// ==============

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { evaluate, batchEvaluate, logDecision } from '../engine/evaluate';
import { prisma } from '@permix/db';

export const v1Routes = new Hono();

// Apply auth and rate limiting to all v1 routes
v1Routes.use('*', authMiddleware);
v1Routes.use('*', rateLimitMiddleware({ maxRequests: 1000 }));

// ============================================
// Schemas
// ============================================

const entitySchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    attributes: z.record(z.unknown()).optional().default({}),
});

const resourceSchema = z.object({
    type: z.string().min(1),
    id: z.string().optional(),
    attributes: z.record(z.unknown()).optional(),
});

const evaluateRequestSchema = z.object({
    entity: entitySchema,
    action: z.string().min(1),
    resource: resourceSchema,
    context: z.record(z.unknown()).optional(),
});

const batchEvaluateRequestSchema = z.object({
    requests: z.array(evaluateRequestSchema).min(1).max(100),
});

// ============================================
// POST /v1/evaluate - Main Decision Endpoint
// ============================================

v1Routes.post('/evaluate', zValidator('json', evaluateRequestSchema), async (c) => {
    const auth = c.get('auth');
    const body = c.req.valid('json');

    const result = await evaluate({
        organizationId: auth.organizationId,
        entity: {
            id: body.entity.id,
            type: body.entity.type,
            attributes: body.entity.attributes || {},
        },
        action: body.action,
        resource: body.resource,
        context: body.context,
    });

    // Log decision asynchronously (don't wait)
    logDecision(auth.organizationId, {
        organizationId: auth.organizationId,
        entity: body.entity as { id: string; type: string; attributes: Record<string, unknown> },
        action: body.action,
        resource: body.resource,
        context: body.context,
    }, result);

    return c.json({
        requestId: result.requestId,
        decision: result.decision,
        reason: result.reason,
        matchedPolicy: result.matchedPolicyName,
        evaluatedAt: result.evaluatedAt.toISOString(),
        latencyMs: Math.round(result.latencyMs * 100) / 100,
    });
});

// ============================================
// POST /v1/batch-evaluate - Batch Decisions
// ============================================

v1Routes.post('/batch-evaluate', zValidator('json', batchEvaluateRequestSchema), async (c) => {
    const auth = c.get('auth');
    const { requests } = c.req.valid('json');

    const inputs = requests.map((req) => ({
        organizationId: auth.organizationId,
        entity: {
            id: req.entity.id,
            type: req.entity.type,
            attributes: req.entity.attributes || {},
        },
        action: req.action,
        resource: req.resource,
        context: req.context,
    }));

    const results = await batchEvaluate(inputs);

    // Log decisions asynchronously
    results.forEach((result, i) => {
        logDecision(auth.organizationId, inputs[i], result);
    });

    return c.json({
        results: results.map((result) => ({
            requestId: result.requestId,
            decision: result.decision,
            reason: result.reason,
            matchedPolicy: result.matchedPolicyName,
            evaluatedAt: result.evaluatedAt.toISOString(),
            latencyMs: Math.round(result.latencyMs * 100) / 100,
        })),
    });
});

// ============================================
// GET /v1/policies - List Policies
// ============================================

v1Routes.get('/policies', async (c) => {
    const auth = c.get('auth');

    const policies = await prisma.policy.findMany({
        where: { organizationId: auth.organizationId },
        orderBy: { priority: 'desc' },
        select: {
            id: true,
            name: true,
            description: true,
            effect: true,
            priority: true,
            active: true,
            conditions: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return c.json({
        policies,
        total: policies.length,
    });
});

// ============================================
// GET /v1/policies/:id - Get Policy
// ============================================

v1Routes.get('/policies/:id', async (c) => {
    const auth = c.get('auth');
    const policyId = c.req.param('id');

    const policy = await prisma.policy.findFirst({
        where: {
            id: policyId,
            organizationId: auth.organizationId,
        },
    });

    if (!policy) {
        return c.json(
            { error: { message: 'Policy not found', code: 'NOT_FOUND' } },
            404
        );
    }

    return c.json({ policy });
});

// ============================================
// POST /v1/policies - Create Policy
// ============================================

const createPolicySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    effect: z.enum(['allow', 'deny']),
    priority: z.number().int().min(0).max(1000).optional().default(0),
    active: z.boolean().optional().default(true),
    conditions: z.array(
        z.object({
            field: z.string().min(1),
            operator: z.string().min(1),
            value: z.unknown(),
        })
    ),
});

v1Routes.post('/policies', zValidator('json', createPolicySchema), async (c) => {
    const auth = c.get('auth');
    const body = c.req.valid('json');

    try {
        const policy = await prisma.policy.create({
            data: {
                organizationId: auth.organizationId,
                name: body.name,
                description: body.description,
                effect: body.effect,
                priority: body.priority,
                active: body.active,
                conditions: body.conditions,
            },
        });

        return c.json({ policy }, 201);
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return c.json(
                { error: { message: 'Policy with this name already exists', code: 'DUPLICATE' } },
                409
            );
        }
        throw error;
    }
});

// ============================================
// PUT /v1/policies/:id - Update Policy
// ============================================

const updatePolicySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    effect: z.enum(['allow', 'deny']).optional(),
    priority: z.number().int().min(0).max(1000).optional(),
    active: z.boolean().optional(),
    conditions: z
        .array(
            z.object({
                field: z.string().min(1),
                operator: z.string().min(1),
                value: z.unknown(),
            })
        )
        .optional(),
});

v1Routes.put('/policies/:id', zValidator('json', updatePolicySchema), async (c) => {
    const auth = c.get('auth');
    const policyId = c.req.param('id');
    const body = c.req.valid('json');

    const existing = await prisma.policy.findFirst({
        where: { id: policyId, organizationId: auth.organizationId },
    });

    if (!existing) {
        return c.json(
            { error: { message: 'Policy not found', code: 'NOT_FOUND' } },
            404
        );
    }

    const updated = await prisma.policy.update({
        where: { id: policyId },
        data: {
            ...body,
            version: { increment: 1 },
        },
    });

    return c.json({ policy: updated });
});

// ============================================
// DELETE /v1/policies/:id - Delete Policy
// ============================================

v1Routes.delete('/policies/:id', async (c) => {
    const auth = c.get('auth');
    const policyId = c.req.param('id');

    const existing = await prisma.policy.findFirst({
        where: { id: policyId, organizationId: auth.organizationId },
    });

    if (!existing) {
        return c.json(
            { error: { message: 'Policy not found', code: 'NOT_FOUND' } },
            404
        );
    }

    await prisma.policy.delete({ where: { id: policyId } });

    return c.json({ message: 'Policy deleted' });
});

// ============================================
// POST /v1/policies/:id/activate - Activate Policy
// ============================================

v1Routes.post('/policies/:id/activate', async (c) => {
    const auth = c.get('auth');
    const policyId = c.req.param('id');

    const updated = await prisma.policy.updateMany({
        where: { id: policyId, organizationId: auth.organizationId },
        data: { active: true },
    });

    if (updated.count === 0) {
        return c.json(
            { error: { message: 'Policy not found', code: 'NOT_FOUND' } },
            404
        );
    }

    return c.json({ message: 'Policy activated' });
});

// ============================================
// POST /v1/policies/:id/deactivate - Deactivate Policy
// ============================================

v1Routes.post('/policies/:id/deactivate', async (c) => {
    const auth = c.get('auth');
    const policyId = c.req.param('id');

    const updated = await prisma.policy.updateMany({
        where: { id: policyId, organizationId: auth.organizationId },
        data: { active: false },
    });

    if (updated.count === 0) {
        return c.json(
            { error: { message: 'Policy not found', code: 'NOT_FOUND' } },
            404
        );
    }

    return c.json({ message: 'Policy deactivated' });
});

// ============================================
// GET /v1/decisions - List Recent Decisions
// ============================================

v1Routes.get('/decisions', async (c) => {
    const auth = c.get('auth');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    const decisions = await prisma.decisionLog.findMany({
        where: { organizationId: auth.organizationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
            id: true,
            requestId: true,
            entityId: true,
            entityType: true,
            action: true,
            resourceType: true,
            resourceId: true,
            decision: true,
            reason: true,
            latencyMs: true,
            createdAt: true,
        },
    });

    const total = await prisma.decisionLog.count({
        where: { organizationId: auth.organizationId },
    });

    return c.json({
        decisions,
        total,
        limit,
        offset,
    });
});

// ============================================
// GET /v1/decisions/:id - Get Decision Details
// ============================================

v1Routes.get('/decisions/:id', async (c) => {
    const auth = c.get('auth');
    const decisionId = c.req.param('id');

    const decision = await prisma.decisionLog.findFirst({
        where: {
            id: decisionId,
            organizationId: auth.organizationId,
        },
        include: {
            matchedPolicy: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });

    if (!decision) {
        return c.json(
            { error: { message: 'Decision not found', code: 'NOT_FOUND' } },
            404
        );
    }

    return c.json({ decision });
});

// ============================================
// GET /v1/entities/:id/permissions - List Entity Permissions
// ============================================

v1Routes.get('/entities/:id/permissions', async (c) => {
    const auth = c.get('auth');
    const entityId = c.req.param('id');
    const entityType = c.req.query('type') || 'user';

    // Get entity
    const entity = await prisma.entity.findFirst({
        where: {
            organizationId: auth.organizationId,
            externalId: entityId,
            type: entityType,
        },
    });

    if (!entity) {
        return c.json(
            { error: { message: 'Entity not found', code: 'NOT_FOUND' } },
            404
        );
    }

    // Get all resources
    const resources = await prisma.resource.findMany({
        where: { organizationId: auth.organizationId },
    });

    // Common actions to check
    const actions = ['read', 'write', 'delete', 'admin'];

    // Evaluate permissions for each resource/action combination
    const permissions: Array<{
        resource: string;
        resourceType: string;
        action: string;
        allowed: boolean;
    }> = [];

    for (const resource of resources) {
        for (const action of actions) {
            const result = await evaluate({
                organizationId: auth.organizationId,
                entity: {
                    id: entityId,
                    type: entityType,
                    attributes: entity.attributes as Record<string, unknown>,
                },
                action,
                resource: {
                    type: resource.type,
                    id: resource.id,
                    attributes: resource.attributes as Record<string, unknown>,
                },
            });

            permissions.push({
                resource: resource.name,
                resourceType: resource.type,
                action,
                allowed: result.decision === 'allow',
            });
        }
    }

    return c.json({
        entityId,
        entityType,
        permissions,
    });
});
