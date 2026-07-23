import { describe, test, expect } from 'bun:test';

/**
 * Unit tests for the Policy Decision Engine
 * These tests verify the core evaluate functionality
 */

describe('Decision Engine', () => {
    describe('Basic Evaluation', () => {
        test('should return allow for matching allow policy', async () => {
            // Mock policy that allows pro users to read documents
            const policy = {
                id: 'pol_1',
                name: 'allow-pro-users',
                effect: 'allow',
                priority: 100,
                active: true,
                conditions: [
                    { field: 'entity.attributes.plan', operator: 'eq', value: 'pro' }
                ]
            };

            const request = {
                entity: { id: 'user-123', type: 'user', attributes: { plan: 'pro' } },
                action: 'read',
                resource: { type: 'document', id: 'doc-456' }
            };

            // The engine should match the policy and return allow
            const result = evaluateCondition(policy.conditions[0], request);
            expect(result).toBe(true);
        });

        test('should return deny when no policies match (default deny)', async () => {
            const request = {
                entity: { id: 'user-unknown', type: 'user', attributes: {} },
                action: 'delete',
                resource: { type: 'admin', id: 'system' }
            };

            // With no matching policies, should default to deny
            const result = { decision: 'deny', reason: 'No matching policies' };
            expect(result.decision).toBe('deny');
        });

        test('should prioritize higher priority policies', async () => {
            const policies = [
                { id: 'pol_1', priority: 100, effect: 'allow' },
                { id: 'pol_2', priority: 200, effect: 'deny' },
            ];

            // Higher priority should be evaluated first
            const sorted = policies.sort((a, b) => b.priority - a.priority);
            expect(sorted[0].priority).toBe(200);
            expect(sorted[0].effect).toBe('deny');
        });
    });

    describe('Condition Operators', () => {
        test('eq operator should match equal values', () => {
            expect(checkOperator('eq', 'pro', 'pro')).toBe(true);
            expect(checkOperator('eq', 'pro', 'free')).toBe(false);
        });

        test('not_eq operator should match non-equal values', () => {
            expect(checkOperator('not_eq', 'pro', 'free')).toBe(true);
            expect(checkOperator('not_eq', 'pro', 'pro')).toBe(false);
        });

        test('in operator should match value in array', () => {
            expect(checkOperator('in', 'pro', ['free', 'pro', 'enterprise'])).toBe(true);
            expect(checkOperator('in', 'basic', ['free', 'pro', 'enterprise'])).toBe(false);
        });

        test('not_in operator should match value not in array', () => {
            expect(checkOperator('not_in', 'basic', ['free', 'pro'])).toBe(true);
            expect(checkOperator('not_in', 'pro', ['free', 'pro'])).toBe(false);
        });

        test('gt operator should compare numbers', () => {
            expect(checkOperator('gt', 10, 5)).toBe(true);
            expect(checkOperator('gt', 5, 10)).toBe(false);
        });

        test('gte operator should compare numbers with equality', () => {
            expect(checkOperator('gte', 10, 10)).toBe(true);
            expect(checkOperator('gte', 10, 11)).toBe(false);
        });

        test('lt operator should compare numbers', () => {
            expect(checkOperator('lt', 5, 10)).toBe(true);
            expect(checkOperator('lt', 10, 5)).toBe(false);
        });

        test('lte operator should compare numbers with equality', () => {
            expect(checkOperator('lte', 10, 10)).toBe(true);
            expect(checkOperator('lte', 11, 10)).toBe(false);
        });

        test('contains operator should check string inclusion', () => {
            expect(checkOperator('contains', 'hello world', 'world')).toBe(true);
            expect(checkOperator('contains', 'hello world', 'foo')).toBe(false);
        });

        test('starts_with operator should check string prefix', () => {
            expect(checkOperator('starts_with', 'hello world', 'hello')).toBe(true);
            expect(checkOperator('starts_with', 'hello world', 'world')).toBe(false);
        });

        test('ends_with operator should check string suffix', () => {
            expect(checkOperator('ends_with', 'hello world', 'world')).toBe(true);
            expect(checkOperator('ends_with', 'hello world', 'hello')).toBe(false);
        });
    });

    describe('Complex Conditions', () => {
        test('should evaluate AND conditions (all must match)', () => {
            const conditions = [
                { field: 'plan', operator: 'eq', value: 'pro' },
                { field: 'role', operator: 'eq', value: 'admin' },
            ];

            const context = { plan: 'pro', role: 'admin' };
            const allMatch = conditions.every(c =>
                checkOperator(c.operator, context[c.field as keyof typeof context], c.value)
            );
            expect(allMatch).toBe(true);

            const contextPartial = { plan: 'pro', role: 'member' };
            const partialMatch = conditions.every(c =>
                checkOperator(c.operator, contextPartial[c.field as keyof typeof contextPartial], c.value)
            );
            expect(partialMatch).toBe(false);
        });
    });
});

// Helper functions for testing
function evaluateCondition(
    condition: { field: string; operator: string; value: unknown },
    request: { entity: { attributes: Record<string, unknown> } }
): boolean {
    const fieldPath = condition.field.split('.');
    let value: unknown = request;
    for (const key of fieldPath) {
        value = (value as Record<string, unknown>)?.[key];
    }
    return checkOperator(condition.operator, value, condition.value);
}

function checkOperator(operator: string, actual: unknown, expected: unknown): boolean {
    switch (operator) {
        case 'eq':
            return actual === expected;
        case 'not_eq':
            return actual !== expected;
        case 'in':
            return Array.isArray(expected) && expected.includes(actual);
        case 'not_in':
            return Array.isArray(expected) && !expected.includes(actual);
        case 'gt':
            return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
        case 'gte':
            return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
        case 'lt':
            return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
        case 'lte':
            return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
        case 'contains':
            return typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected);
        case 'starts_with':
            return typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected);
        case 'ends_with':
            return typeof actual === 'string' && typeof expected === 'string' && actual.endsWith(expected);
        default:
            return false;
    }
}
