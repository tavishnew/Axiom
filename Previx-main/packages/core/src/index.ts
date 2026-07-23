// ============================================
// Permix Core - Shared Types & Utilities
// ============================================

// Decision types
export type Decision = 'allow' | 'deny';

export interface DecisionResult {
    decision: Decision;
    reason: string;
    matchedPolicy?: string;
    evaluatedAt: Date;
    latencyMs: number;
}

// Entity types
export interface Entity {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
}

// Resource types
export interface Resource {
    type: string;
    id?: string;
    attributes?: Record<string, unknown>;
}

// Action types
export type Action = string;

// Context types
export interface EvaluationContext {
    entity: Entity;
    action: Action;
    resource: Resource;
    environment?: Record<string, unknown>;
}

// ============================================
// Policy Schema Types
// ============================================

export type ConditionOperator =
    // Comparison operators
    | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
    // Set operators
    | 'in' | 'not_in' | 'contains' | 'not_contains'
    // String operators
    | 'starts_with' | 'ends_with' | 'matches'
    // Existence operators
    | 'exists' | 'not_exists'
    // Logical operators
    | 'and' | 'or' | 'not';

export interface PolicyCondition {
    field: string;
    operator: ConditionOperator;
    value: unknown;
}

export interface Policy {
    id: string;
    name: string;
    description?: string;
    effect: Decision;
    conditions: PolicyCondition[];
    priority: number;
    active: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Policy Dimension Types (RBAC, Plan, Usage, Time)
// ============================================

// Role-based conditions
export interface RoleCondition {
    field: 'entity.attributes.role';
    operator: 'eq' | 'in';
    value: string | string[];
}

// Plan-based conditions
export interface PlanCondition {
    field: 'entity.attributes.plan';
    operator: 'eq' | 'in';
    value: 'free' | 'pro' | 'enterprise' | string[];
}

// Usage-based conditions
export interface UsageCondition {
    field: string; // e.g., 'usage.api_calls', 'usage.storage_bytes'
    operator: 'lt' | 'lte' | 'gt' | 'gte';
    value: number;
}

// Time-based conditions
export interface TimeCondition {
    field: 'environment.timestamp' | 'environment.hour' | 'environment.dayOfWeek';
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'in';
    value: string | number | number[];
}

// ============================================
// Policy Template Types
// ============================================

export interface PolicyTemplate {
    name: string;
    description: string;
    category: 'rbac' | 'plan' | 'usage' | 'time' | 'custom';
    effect: Decision;
    conditions: PolicyCondition[];
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
    {
        name: 'allow-admin-all',
        description: 'Allow admin role full access',
        category: 'rbac',
        effect: 'allow',
        conditions: [{ field: 'entity.attributes.role', operator: 'eq', value: 'admin' }],
    },
    {
        name: 'allow-pro-features',
        description: 'Allow pro/enterprise plans access to premium features',
        category: 'plan',
        effect: 'allow',
        conditions: [{ field: 'entity.attributes.plan', operator: 'in', value: ['pro', 'enterprise'] }],
    },
    {
        name: 'deny-free-export',
        description: 'Deny free plan access to export feature',
        category: 'plan',
        effect: 'deny',
        conditions: [
            { field: 'entity.attributes.plan', operator: 'eq', value: 'free' },
            { field: 'resource.type', operator: 'eq', value: 'feature' },
            { field: 'resource.name', operator: 'eq', value: 'export' },
        ],
    },
];

// ============================================
// API Request/Response Types
// ============================================

export interface EvaluateRequest {
    entity: Entity;
    action: Action;
    resource: Resource;
    context?: Record<string, unknown>;
}

export interface EvaluateResponse extends DecisionResult {
    requestId: string;
}

export interface CreatePolicyRequest {
    name: string;
    description?: string;
    effect: Decision;
    priority?: number;
    active?: boolean;
    conditions: PolicyCondition[];
}

export interface UpdatePolicyRequest {
    name?: string;
    description?: string;
    effect?: Decision;
    priority?: number;
    active?: boolean;
    conditions?: PolicyCondition[];
}

// ============================================
// Constants
// ============================================

export const DEFAULT_DECISION: Decision = 'deny';

export const SUPPORTED_OPERATORS: ConditionOperator[] = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'in', 'not_in', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'matches',
    'exists', 'not_exists',
    'and', 'or', 'not',
];

export const SUPPORTED_PLANS = ['free', 'pro', 'enterprise'] as const;
export type Plan = (typeof SUPPORTED_PLANS)[number];

export const SUPPORTED_ROLES = ['viewer', 'member', 'admin', 'owner'] as const;
export type Role = (typeof SUPPORTED_ROLES)[number];

// ============================================
// Utility Functions
// ============================================

export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generatePolicyId(): string {
    return `pol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function isValidOperator(op: string): op is ConditionOperator {
    return SUPPORTED_OPERATORS.includes(op as ConditionOperator);
}

export function isValidPlan(plan: string): plan is Plan {
    return SUPPORTED_PLANS.includes(plan as Plan);
}

export function isValidRole(role: string): role is Role {
    return SUPPORTED_ROLES.includes(role as Role);
}

// Validate a policy condition
export function validateCondition(condition: PolicyCondition): boolean {
    if (!condition.field || typeof condition.field !== 'string') return false;
    if (!isValidOperator(condition.operator)) return false;
    return true;
}

// Validate an entire policy
export function validatePolicy(policy: CreatePolicyRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!policy.name || policy.name.length < 1) {
        errors.push('Policy name is required');
    }

    if (!['allow', 'deny'].includes(policy.effect)) {
        errors.push('Policy effect must be "allow" or "deny"');
    }

    if (!Array.isArray(policy.conditions)) {
        errors.push('Policy conditions must be an array');
    } else {
        policy.conditions.forEach((cond, i) => {
            if (!validateCondition(cond)) {
                errors.push(`Invalid condition at index ${i}`);
            }
        });
    }

    return { valid: errors.length === 0, errors };
}
