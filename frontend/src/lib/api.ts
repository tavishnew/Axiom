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

export interface PaginationParams {
 page?: number;
 limit?: number;
 q?: string;
 sortBy?: string;
 sortOrder?: 'asc' | 'desc';
 [key: string]: string | number | boolean | undefined;
}

export interface PaginatedResponse<T> {
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

export interface PolicyAssignment {
 id: string;
 entityId: string;
 policyId: string;
 createdAt: string;
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
 key?: string; // Only present on creation
 createdAt: string;
 organizationId: string;
 lastUsedAt?: string;
 expiresAt?: string;
 revokedAt?: string;
}

export interface Organization {
 id: string;
 name: string;
 slug: string;
 createdAt: string;
 updatedAt: string;
}

export interface User {
 id: string;
 name: string;
 email: string;
 emailVerified: boolean;
 image: string | null;
 role: string;
 organizationId: string | null;
 createdAt: string;
 updatedAt: string;
}

export interface Session {
 id: string;
 token: string;
 userId: string;
 expiresAt: string;
 createdAt: string;
}

export interface StatCardData {
  label: string;
  value: number;
  change: string | null;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

function buildQuery(params: Record<string, string | number | boolean | undefined> | PaginationParams & Record<string, string | number | boolean | undefined>): string {
 const searchParams = new URLSearchParams();
 Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
 if (value !== undefined && value !== null && value !== '') {
 searchParams.append(key, String(value));
 }
 });
 const qs = searchParams.toString();
 return qs ? `?${qs}` : '';
}

export const api = {
 // Policies
 policies: {
 list: (params?: PaginationParams & { effect?: string; active?: string }) =>
 request<PaginatedResponse<Policy>>(`/policies${buildQuery(params || {})}`),
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
 list: (params?: PaginationParams & { type?: string }) =>
 request<PaginatedResponse<Entity>>(`/entities${buildQuery(params || {})}`),
 get: (id: string) => request<Entity>(`/entities/${id}`),
 create: (data: Partial<Entity>) =>
 request<Entity>('/entities', { method: 'POST', body: JSON.stringify(data) }),
 update: (id: string, data: Partial<Entity>) =>
 request<Entity>(`/entities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
 delete: (id: string) =>
 request<{ success: boolean }>(`/entities/${id}`, { method: 'DELETE' }),
 // Policy assignments
 getPolicies: (entityId: string) =>
 request<PolicyAssignment[]>(`/entities/${entityId}/policies`),
 assignPolicy: (entityId: string, policyId: string) =>
 request<PolicyAssignment>(`/entities/${entityId}/policies`, {
 method: 'POST',
 body: JSON.stringify({ policyId }),
 }),
 removePolicy: (entityId: string, policyId: string) =>
 request<{ success: boolean }>(`/entities/${entityId}/policies/${policyId}`, { method: 'DELETE' }),
 },

 // Resources
 resources: {
 list: (params?: PaginationParams & { type?: string }) =>
 request<PaginatedResponse<Resource>>(`/resources${buildQuery(params || {})}`),
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
 list: (params?: PaginationParams & {
 entityId?: string;
 entityType?: string;
 action?: string;
 resourceType?: string;
 decision?: string;
 since?: string;
 until?: string;
 }) =>
 request<PaginatedResponse<DecisionLog>>(`/decisions${buildQuery(params || {})}`),
 evaluate: (data: {
 entity: Record<string, unknown>;
 action: string;
 resource: Record<string, unknown>;
 }) =>
 request<{ decision: string; reason: string; latencyMs: number; matchedPolicy?: string }>(
 '/decisions/evaluate',
 { method: 'POST', body: JSON.stringify(data) }
 ),
 },

 // API Keys
 apiKeys: {
 list: (params?: PaginationParams & { includeRevoked?: boolean }) =>
 request<PaginatedResponse<ApiKey>>(`/api-keys${buildQuery(params || {})}`),
 create: (data: Partial<ApiKey>) =>
 request<ApiKey>('/api-keys', { method: 'POST', body: JSON.stringify(data) }),
 get: (id: string) => request<ApiKey>(`/api-keys/${id}`),
 delete: (id: string) =>
 request<{ success: boolean }>(`/api-keys/${id}`, { method: 'DELETE' }),
 },

 // Policy Assignments
 policyAssignments: {
 list: (entityId: string) =>
 request<{ entityId: string; policyId: string }[]>(`/entities/${entityId}/policies`),
 create: (entityId: string, policyId: string) =>
 request<{ entityId: string; policyId: string }>(`/entities/${entityId}/policies`, {
 method: 'POST',
 body: JSON.stringify({ policyId }),
 }),
 delete: (entityId: string, policyId: string) =>
 request<{ success: boolean }>(`/entities/${entityId}/policies/${policyId}`, { method: 'DELETE' }),
 },

 // Organizations
 organizations: {
 list: () => request<Organization[]>('/organizations'),
 create: (data: Partial<Organization>) =>
 request<Organization>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
 },

 // Team
 team: {
 list: () => request<any[]>('/team'),
 invite: (data: { email: string; name?: string; role?: string }) =>
 request<any>('/team/invite', { method: 'POST', body: JSON.stringify(data) }),
 update: (id: string, data: { role: string }) =>
 request<any>(`/team/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
 remove: (id: string) =>
 request<{ success: boolean }>(`/team/${id}`, { method: 'DELETE' }),
 },

 // Auth / Profile
 auth: {
 getProfile: () => request<{ data: User }>('/auth/profile'),
 updateProfile: (data: Partial<User>) =>
 request<{ data: User }>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
 changePassword: (data: { currentPassword: string; newPassword: string }) =>
 request<{ success: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
 listSessions: () => request<Session[]>('/auth/sessions'),
 revokeSession: (id: string) =>
 request<{ success: boolean }>(`/auth/sessions/${id}`, { method: 'DELETE' }),
 },

 // Billing
 billing: {
 getSubscription: () => request<{ data: any }>('/billing/subscription'),
 createCheckout: (data: { priceId: string; successUrl?: string; cancelUrl?: string }) =>
 request<{ data: { url: string } }>('/billing/checkout', { method: 'POST', body: JSON.stringify(data) }),
 createPortal: () =>
 request<{ data: { url: string } }>('/billing/portal', { method: 'POST' }),
 },

 // Health
 health: () => request<{ status: string }>('/healthz'),
};
