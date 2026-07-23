// Policy Decision Engine
// =======================

import type { Decision } from '@permix/core';
import { DEFAULT_DECISION, generateRequestId } from '@permix/core';
import { prisma } from '@permix/db';

export interface EvaluationContext {
    entity: {
        id: string;
        type: string;
        attributes: Record<string, unknown>;
    };
    action: string;
    resource: {
        type: string;
        id?: string;
        attributes?: Record<string, unknown>;
    };
    environment?: Record<string, unknown>;
}

interface PolicyRecord {
    id: string;
    name: string;
    description: string | null;
    effect: string;
    priority: number;
    active: boolean;
    conditions: unknown;
}

// ============================================
// Condition Evaluator
// ============================================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        if (typeof current === 'object') {
            current = (current as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }

    return current;
}

function evaluateCondition(
    condition: { field: string; operator: string; value: unknown },
    context: Record<string, unknown>
): boolean {
    const fieldValue = getNestedValue(context, condition.field);
    const { operator, value } = condition;

    switch (operator) {
        case 'eq':
            return fieldValue === value;

        case 'neq':
            return fieldValue !== value;

        case 'gt':
            return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;

        case 'gte':
            return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;

        case 'lt':
            return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;

        case 'lte':
            return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;

        case 'in':
            return Array.isArray(value) && value.includes(fieldValue);

        case 'not_in':
            return Array.isArray(value) && !value.includes(fieldValue);

        case 'contains':
            if (typeof fieldValue === 'string' && typeof value === 'string') {
                return fieldValue.includes(value);
            }
            if (Array.isArray(fieldValue)) {
                return fieldValue.includes(value);
            }
            return false;

        case 'starts_with':
            return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.startsWith(value);

        case 'ends_with':
            return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.endsWith(value);

        case 'exists':
            return fieldValue !== undefined && fieldValue !== null;

        case 'not_exists':
            return fieldValue === undefined || fieldValue === null;

        default:
            console.warn(`Unknown operator: ${operator}`);
            return false;
    }
}

function evaluateConditions(
    conditions: Array<{ field: string; operator: string; value: unknown }>,
    context: Record<string, unknown>
): boolean {
    // All conditions must match (AND logic)
    for (const condition of conditions) {
        if (!evaluateCondition(condition, context)) {
            return false;
        }
    }
    return true;
}

// ============================================
// Policy Matcher
// ============================================

async function loadPolicies(organizationId: string): Promise<PolicyRecord[]> {
    return prisma.policy.findMany({
        where: {
            organizationId,
            active: true,
        },
        orderBy: {
            priority: 'desc', // Higher priority first
        },
    });
}

function buildEvaluationContext(input: EvaluationContext): Record<string, unknown> {
    return {
        entity: input.entity,
        action: input.action,
        resource: input.resource,
        environment: {
            ...input.environment,
            timestamp: new Date().toISOString(),
            dayOfWeek: new Date().getDay(),
            hour: new Date().getHours(),
        },
    };
}

// ============================================
// Main Evaluate Function
// ============================================

export interface EvaluateInput {
    organizationId: string;
    entity: EvaluationContext['entity'];
    action: string;
    resource: EvaluationContext['resource'];
    context?: Record<string, unknown>;
}

export interface EvaluateOutput {
    requestId: string;
    decision: Decision;
    reason: string;
    matchedPolicy: string | null;
    matchedPolicyName: string | null;
    evaluatedPolicies: number;
    evaluatedAt: Date;
    latencyMs: number;
}

export async function evaluate(input: EvaluateInput): Promise<EvaluateOutput> {
    const startTime = performance.now();
    const requestId = generateRequestId();

    try {
        // Load all active policies for the organization
        const policies = await loadPolicies(input.organizationId);

        if (policies.length === 0) {
            return {
                requestId,
                decision: DEFAULT_DECISION,
                reason: 'No policies defined',
                matchedPolicy: null,
                matchedPolicyName: null,
                evaluatedPolicies: 0,
                evaluatedAt: new Date(),
                latencyMs: performance.now() - startTime,
            };
        }

        // Build evaluation context
        const context = buildEvaluationContext({
            entity: input.entity,
            action: input.action,
            resource: input.resource,
            environment: input.context,
        });

        // Evaluate each policy in priority order
        for (const policy of policies) {
            const conditions = policy.conditions as Array<{ field: string; operator: string; value: unknown }>;

            // Check if all conditions match
            if (evaluateConditions(conditions, context)) {
                const decision = policy.effect as Decision;

                return {
                    requestId,
                    decision,
                    reason: `Matched policy: ${policy.name}`,
                    matchedPolicy: policy.id,
                    matchedPolicyName: policy.name,
                    evaluatedPolicies: policies.length,
                    evaluatedAt: new Date(),
                    latencyMs: performance.now() - startTime,
                };
            }
        }

        // No policy matched - default deny
        return {
            requestId,
            decision: DEFAULT_DECISION,
            reason: 'No matching policy found',
            matchedPolicy: null,
            matchedPolicyName: null,
            evaluatedPolicies: policies.length,
            evaluatedAt: new Date(),
            latencyMs: performance.now() - startTime,
        };
    } catch (error) {
        console.error('Evaluation error:', error);
        throw error;
    }
}

// ============================================
// Batch Evaluate
// ============================================

export async function batchEvaluate(
    inputs: EvaluateInput[]
): Promise<EvaluateOutput[]> {
    // Run evaluations in parallel
    return Promise.all(inputs.map(evaluate));
}

// ============================================
// Decision Logging
// ============================================

export async function logDecision(
    organizationId: string,
    input: EvaluateInput,
    output: EvaluateOutput
): Promise<void> {
    try {
        await prisma.decisionLog.create({
            data: {
                requestId: output.requestId,
                organizationId,
                entityId: input.entity.id,
                entityType: input.entity.type,
                action: input.action,
                resourceType: input.resource.type,
                resourceId: input.resource.id || null,
                decision: output.decision,
                reason: output.reason,
                matchedPolicyId: output.matchedPolicy,
                context: input.context || {},
                latencyMs: Math.round(output.latencyMs),
            },
        });
    } catch (error) {
        console.error('Failed to log decision:', error);
        // Don't throw - logging failures shouldn't break the API
    }
}
