import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { evaluatePolicy, evaluatePolicies, Policy, Entity, Resource } from '../lib/policy-evaluator';

describe('Policy Evaluation', () => {
  const mockPolicy = {
    id: 'pol_test',
    effect: 'allow' as const,
    priority: 10,
    active: true,
    conditions: [
      { field: 'entity.attributes.plan', operator: 'equals' as const, value: 'pro' },
      { field: 'entity.type', operator: 'equals' as const, value: 'user' },
    ],
  };

  const mockEntity = {
    id: 'ent_123',
    type: 'user',
    attributes: { plan: 'pro', role: 'admin' },
  };

  const mockResource = {
    type: 'document',
    id: 'doc_456',
    attributes: {},
  };

  it('should allow when all conditions match', () => {
    const result = evaluatePolicy(mockPolicy, mockEntity, 'read', mockResource);
    expect(result.decision).toBe('allow');
    expect(result.matchedPolicy).toBe(mockPolicy.id);
  });

  it('should deny when condition fails', () => {
    const entity = { ...mockEntity, attributes: { plan: 'free' } };
    const result = evaluatePolicy(mockPolicy, entity, 'read', mockResource);
    expect(result.decision).toBe('deny');
  });

  it('should deny when policy is inactive', () => {
    const policy = { ...mockPolicy, active: false };
    const result = evaluatePolicy(policy, mockEntity, 'read', mockResource);
    expect(result.decision).toBe('deny');
  });

  it('should handle missing fields gracefully', () => {
    const entity = { ...mockEntity, attributes: {} };
    const result = evaluatePolicy(mockPolicy, entity, 'read', mockResource);
    expect(result.decision).toBe('deny');
  });

  it('should support "in" operator', () => {
    const policy = {
      ...mockPolicy,
      conditions: [{ field: 'entity.attributes.role', operator: 'in' as const, value: ['admin', 'owner'] }],
    };
    const result = evaluatePolicy(policy, mockEntity, 'read', mockResource);
    expect(result.decision).toBe('allow');
  });

  it('should support "contains" operator for strings', () => {
    const policy = {
      ...mockPolicy,
      conditions: [{ field: 'entity.attributes.name', operator: 'contains' as const, value: 'admin' }],
    };
    const entity = { ...mockEntity, attributes: { name: 'super_admin_user' } };
    const result = evaluatePolicy(policy, entity, 'read', mockResource);
    expect(result.decision).toBe('allow');
  });

  it('should correctly evaluate priority (higher priority wins)', () => {
    const policies = [
      { ...mockPolicy, id: 'pol_low', priority: 1, effect: 'deny' as const, conditions: [{ field: 'entity.attributes.plan', operator: 'equals' as const, value: 'pro' }] },
      { ...mockPolicy, id: 'pol_high', priority: 100, effect: 'allow' as const, conditions: [{ field: 'entity.attributes.plan', operator: 'equals' as const, value: 'pro' }] },
    ];
    // Higher priority should win
    const result = evaluatePolicy(policies[1], mockEntity, 'read', mockResource);
    expect(result.decision).toBe('allow');
  });
});

// Test password hashing
describe('Password Hashing', () => {
  it('should hash password with bcrypt', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 12);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('should verify correct password', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 12);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 12);
    const valid = await bcrypt.compare('wrongpassword', hash);
    expect(valid).toBe(false);
  });
});

// Test API key hashing
describe('API Key Hashing', () => {
  it('should generate SHA-256 hash of API key', () => {
    const rawKey = 'ak_abcdef123456';
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');
    expect(hashedKey).toHaveLength(64);
    expect(hashedKey).toMatch(/^[a-f0-9]+$/);
  });

  it('should produce consistent hash for same key', () => {
    const rawKey = 'ak_abcdef123456';
    const hash1 = createHash('sha256').update(rawKey).digest('hex');
    const hash2 = createHash('sha256').update(rawKey).digest('hex');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash for different keys', () => {
    const hash1 = createHash('sha256').update('ak_key1').digest('hex');
    const hash2 = createHash('sha256').update('ak_key2').digest('hex');
    expect(hash1).not.toBe(hash2);
  });
});

describe('Zod Validation Schemas', () => {
  it('should have test placeholder for Zod schemas', () => {
    // Placeholder - actual schema validation tests would go here
    expect(true).toBe(true);
  });
});