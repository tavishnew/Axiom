import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluatePolicies } from '../lib/policy-evaluator';

describe('Multi-Policy Evaluation', () => {
  const baseEntity = {
    id: 'ent_123',
    type: 'user',
    attributes: { plan: 'pro', department: 'engineering' },
  };

  const baseResource = {
    type: 'document',
    id: 'doc_456',
    attributes: { classification: 'internal' },
  };

  it('should return deny when no policies match', () => {
    const policies = [
      {
        id: 'pol_1',
        effect: 'allow' as const,
        priority: 10,
        active: true,
        conditions: [{ field: 'entity.attributes.plan', operator: 'equals' as const, value: 'enterprise' }],
      },
    ];

    const result = evaluatePolicies(policies, baseEntity, 'read', baseResource);
    expect(result.decision).toBe('deny');
  });

  it('should match highest priority policy when multiple policies match', () => {
    const policies = [
      {
        id: 'pol_low',
        effect: 'deny' as const,
        priority: 1,
        active: true,
        conditions: [{ field: 'entity.attributes.plan', operator: 'equals' as const, value: 'pro' }],
      },
      {
        id: 'pol_high',
        effect: 'allow' as const,
        priority: 100,
        active: true,
        conditions: [{ field: 'entity.attributes.plan', operator: 'equals' as const, value: 'pro' }],
      },
    ];

    const result = evaluatePolicies(policies, baseEntity, 'read', baseResource);
    expect(result.decision).toBe('allow');
    expect(result.matchedPolicy).toBe('pol_high');
  });

  it('should skip inactive policies', () => {
    const policies = [
      {
        id: 'pol_inactive',
        effect: 'allow' as const,
        priority: 100,
        active: false,
        conditions: [{ field: 'entity.attributes.plan', operator: 'equals' as const, value: 'pro' }],
      },
      {
        id: 'pol_active_deny',
        effect: 'deny' as const,
        priority: 10,
        active: true,
        conditions: [{ field: 'entity.attributes.plan', operator: 'equals' as const, value: 'pro' }],
      },
    ];

    const result = evaluatePolicies(policies, baseEntity, 'read', baseResource);
    expect(result.decision).toBe('deny');
    expect(result.matchedPolicy).toBe('pol_active_deny');
  });

  it('should handle complex nested field access', () => {
    const entity = {
      ...baseEntity,
      attributes: { metadata: { clearance: 'secret', tags: ['finance', 'reports'] } },
    };

    const policies = [
      {
        id: 'pol_nested',
        effect: 'allow' as const,
        priority: 10,
        active: true,
        conditions: [
          { field: 'entity.attributes.metadata.clearance', operator: 'equals' as const, value: 'secret' },
          { field: 'entity.attributes.metadata.tags', operator: 'contains' as const, value: 'finance' },
        ],
      },
    ];

    const result = evaluatePolicies(policies, entity, 'read', baseResource);
    expect(result.decision).toBe('allow');
  });

  it('should handle numeric comparisons', () => {
    const policies = [
      {
        id: 'pol_numeric',
        effect: 'allow' as const,
        priority: 10,
        active: true,
        conditions: [
          { field: 'entity.attributes.maxFileSize', operator: 'gte' as const, value: 100 },
          { field: 'entity.attributes.maxFileSize', operator: 'lte' as const, value: 1000 },
        ],
      },
    ];

    const entity = { ...baseEntity, attributes: { maxFileSize: 500 } };
    const result = evaluatePolicies(policies, entity, 'read', baseResource);
    expect(result.decision).toBe('allow');

    const entity2 = { ...baseEntity, attributes: { maxFileSize: 50 } };
    const result2 = evaluatePolicies(policies, entity2, 'read', baseResource);
    expect(result2.decision).toBe('deny');
  });
});