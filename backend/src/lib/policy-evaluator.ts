export interface Policy {
  id: string;
  effect: 'allow' | 'deny';
  priority: number;
  active: boolean;
  conditions: Condition[];
}

export interface Entity {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

export interface Resource {
  type: string;
  id?: string;
  attributes?: Record<string, unknown>;
}

export interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'not_contains' | 'exists' | 'not_exists' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
}

export interface EvaluationResult {
  decision: 'allow' | 'deny';
  reason: string;
  matchedPolicy?: string;
  latencyMs: number;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateCondition(condition: Condition, entity: Entity, resource: Resource): boolean {
  const context: Record<string, unknown> = {
    entity,
    resource,
    action: '',
  };

  const fieldValue = getNestedValue(context, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return typeof fieldValue === 'string' && typeof condition.value === 'string' && fieldValue.includes(condition.value);
    case 'not_contains':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(condition.value);
      }
      return typeof fieldValue === 'string' && typeof condition.value === 'string' && !fieldValue.includes(condition.value);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    case 'gt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue > condition.value;
    case 'lt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue < condition.value;
    case 'gte':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue >= condition.value;
    case 'lte':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue <= condition.value;
    default:
      return false;
  }
}

export function evaluatePolicy(
  policy: Policy,
  entity: Entity,
  action: string,
  resource: Resource
): EvaluationResult {
  const start = Date.now();

  if (!policy.active) {
    return {
      decision: 'deny',
      reason: 'Policy is inactive',
      latencyMs: Date.now() - start,
    };
  }

  const allConditionsMet = policy.conditions.every(c =>
    evaluateCondition(c, entity, resource)
  );

  if (allConditionsMet) {
    return {
      decision: policy.effect,
      reason: `Matched policy ${policy.id}`,
      matchedPolicy: policy.id,
      latencyMs: Date.now() - start,
    };
  }

  return {
    decision: 'deny',
    reason: 'No matching policy conditions',
    latencyMs: Date.now() - start,
  };
}

export function evaluatePolicies(
  policies: Policy[],
  entity: Entity,
  action: string,
  resource: Resource
): EvaluationResult {
  // Sort by priority descending (highest first)
  const sorted = [...policies].sort((a, b) => b.priority - a.priority);

  for (const policy of sorted) {
    const result = evaluatePolicy(policy, entity, action, resource);
    if (result.decision !== 'deny' || result.matchedPolicy) {
      return result;
    }
  }

  return {
    decision: 'deny',
    reason: 'No matching policy found',
    latencyMs: 0,
  };
}