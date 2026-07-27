/**
 * API client for the Axiom/PreVix backend
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: string;
  priority: number;
  active: boolean;
  conditions: Record<string, unknown>[];
  version: number;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface Entity {
  id: string;
  externalId: string;
  type: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface Resource {
  id: string;
  type: string;
  name: string;
  description?: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface DecisionLog {
  id: string;
  requestId: string;
  entityId: string;
  entityType: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  decision: string;
  reason: string;
  context: Record<string, unknown>;
  latencyMs: number;
  createdAt: string;
  organizationId: string;
  matchedPolicyId?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Policies
  policies: {
    list: () => request<Policy[]>('/policies'),
    get: (id: string) => request<Policy>(`/policies/${id}`),
    create: (data: Partial<Policy>) =>
      request<Policy>('/policies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Policy>) =>
      request<Policy>(`/policies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/policies/${id}`, { method: 'DELETE' }),
  },

  // Entities
  entities: {
    list: () => request<Entity[]>('/entities'),
    get: (id: string) => request<Entity>(`/entities/${id}`),
    create: (data: Partial<Entity>) =>
      request<Entity>('/entities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Entity>) =>
      request<Entity>(`/entities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/entities/${id}`, { method: 'DELETE' }),
  },

  // Resources
  resources: {
    list: () => request<Resource[]>('/resources'),
    get: (id: string) => request<Resource>(`/resources/${id}`),
    create: (data: Partial<Resource>) =>
      request<Resource>('/resources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Resource>) =>
      request<Resource>(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/resources/${id}`, { method: 'DELETE' }),
  },

  // Decisions
  decisions: {
    list: (limit = 50) => request<DecisionLog[]>(`/decisions?limit=${limit}`),
    evaluate: (data: { entity: Record<string, unknown>; action: string; resource: Record<string, unknown> }) =>
      request<{ decision: string; reason: string; latencyMs: number; matchedPolicy?: string }>('/decisions/evaluate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // API Keys
  apiKeys: {
    list: () => request<ApiKey[]>('/api-keys'),
    create: (data: Partial<ApiKey>) =>
      request<ApiKey>('/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Organizations
  organizations: {
    list: () => request<Organization[]>('/organizations'),
    create: (data: Partial<Organization>) =>
      request<Organization>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Health
  health: () => request<{ status: string }>('/healthz'),
};
