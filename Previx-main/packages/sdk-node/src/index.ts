/**
 * AccessForge Node.js SDK
 * ==================
 *
 * The official Node.js SDK for AccessForge - Authorization as a Service.
 *
 * @packageDocumentation
 */

import type {
    Entity,
    Resource,
    Action,
    EvaluateRequest,
    EvaluateResponse,
    DecisionResult,
    Decision,
} from '@accessforge/core';
import { generateRequestId } from '@accessforge/core';

// ============================================
// Types & Interfaces
// ============================================

/**
 * Configuration options for the AccessForge client
 */
export interface AccessForgeConfig {
    /** Your AccessForge API key */
    apiKey: string;
    /** Base URL for the AccessForge API (default: https://api.accessforge.io) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 5000) */
    timeout?: number;
    /** Number of retries for failed requests (default: 3) */
    retries?: number;
    /** Enable debug logging (default: false) */
    debug?: boolean;
    /** Cache configuration */
    cache?: CacheConfig;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
    /** Enable caching (default: true) */
    enabled?: boolean;
    /** Cache TTL in milliseconds (default: 60000 = 1 minute) */
    ttlMs?: number;
    /** Maximum cache entries (default: 1000) */
    maxEntries?: number;
    /** Custom cache adapter (optional) */
    adapter?: CacheAdapter;
}

/**
 * Interface for custom cache adapters
 */
export interface CacheAdapter {
    get(key: string): Promise<DecisionResult | undefined>;
    set(key: string, value: DecisionResult, ttlMs: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

/**
 * Options for checking permissions
 */
export interface CheckOptions {
    /** The entity (user, service, etc.) performing the action */
    entity: Entity;
    /** The action being performed (e.g., 'read', 'write', 'delete') */
    action: Action;
    /** The resource being accessed */
    resource: Resource;
    /** Additional context for the evaluation */
    context?: Record<string, unknown>;
    /** Skip cache for this request (default: false) */
    skipCache?: boolean;
}

// ============================================
// In-Memory Cache Implementation
// ============================================

interface CacheEntry {
    value: DecisionResult;
    expiresAt: number;
}

class InMemoryCache implements CacheAdapter {
    private cache = new Map<string, CacheEntry>();
    private maxEntries: number;

    constructor(maxEntries = 1000) {
        this.maxEntries = maxEntries;
    }

    async get(key: string): Promise<DecisionResult | undefined> {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    async set(key: string, value: DecisionResult, ttlMs: number): Promise<void> {
        // Evict oldest entries if at capacity
        if (this.cache.size >= this.maxEntries) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }
}

// ============================================
// Error Classes
// ============================================

/**
 * Error thrown when an AccessForge API request fails
 */
export class AccessForgeError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode?: number
    ) {
        super(message);
        this.name = 'AccessForgeError';
    }
}

// ============================================
// Main AccessForge Client
// ============================================

/**
 * The main AccessForge client for checking permissions
 *
 * @example
 * ```typescript
 * const accessForge = new AccessForge({ apiKey: 'your-api-key' });
 *
 * const canAccess = await accessForge.can({
 *   entity: { id: 'user-123', type: 'user', attributes: { plan: 'pro' } },
 *   action: 'read',
 *   resource: { type: 'document', id: 'doc-456' },
 * });
 *
 * if (canAccess) {
 *   // Allow access
 * } else {
 *   // Deny access
 * }
 * ```
 */
export class AccessForge {
    private apiKey: string;
    private baseUrl: string;
    private timeout: number;
    private retries: number;
    private debug: boolean;
    private cache: CacheAdapter | null;
    private cacheTtlMs: number;

    constructor(config: AccessForgeConfig) {
        if (!config.apiKey) {
            throw new AccessForgeError('API key is required', 'MISSING_API_KEY');
        }

        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'https://api.accessforge.io';
        this.timeout = config.timeout || 5000;
        this.retries = config.retries || 3;
        this.debug = config.debug || false;

        // Initialize cache
        const cacheConfig = config.cache || {};
        if (cacheConfig.enabled !== false) {
            this.cache = cacheConfig.adapter || new InMemoryCache(cacheConfig.maxEntries);
            this.cacheTtlMs = cacheConfig.ttlMs || 60000;
        } else {
            this.cache = null;
            this.cacheTtlMs = 0;
        }
    }

    /**
     * Log debug messages
     */
    private log(...args: unknown[]): void {
        if (this.debug) {
            console.log('[AccessForge]', ...args);
        }
    }

    /**
     * Generate a cache key for a check request
     */
    private getCacheKey(options: CheckOptions): string {
        return JSON.stringify({
            entity: options.entity,
            action: options.action,
            resource: options.resource,
            context: options.context,
        });
    }

    /**
     * Check if an entity can perform an action on a resource
     *
     * @param options - The check options
     * @returns The decision result with details
     */
    async check(options: CheckOptions): Promise<DecisionResult> {
        // Check cache first
        if (this.cache && !options.skipCache) {
            const cacheKey = this.getCacheKey(options);
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                this.log('Cache hit for', cacheKey);
                return cached;
            }
        }

        const request: EvaluateRequest = {
            entity: options.entity,
            action: options.action,
            resource: options.resource,
            context: options.context,
        };

        const response = await this.request<EvaluateResponse>('POST', '/v1/evaluate', request);

        const result: DecisionResult = {
            decision: response.decision,
            reason: response.reason,
            matchedPolicy: response.matchedPolicy,
            evaluatedAt: new Date(response.evaluatedAt),
            latencyMs: response.latencyMs,
        };

        // Store in cache
        if (this.cache && !options.skipCache) {
            const cacheKey = this.getCacheKey(options);
            await this.cache.set(cacheKey, result, this.cacheTtlMs);
            this.log('Cached result for', cacheKey);
        }

        return result;
    }

    /**
     * Boolean helper - returns true if allowed, false if denied
     *
     * @param options - The check options
     * @returns true if the action is allowed, false otherwise
     *
     * @example
     * ```typescript
     * if (await accessForge.can({ entity, action: 'delete', resource })) {
     *   // Delete the resource
     * }
     * ```
     */
    async can(options: CheckOptions): Promise<boolean> {
        const result = await this.check(options);
        return result.decision === 'allow';
    }

    /**
     * Batch check multiple permissions in a single request
     *
     * @param checks - Array of check options
     * @returns Array of decision results
     */
    async batchCheck(checks: CheckOptions[]): Promise<DecisionResult[]> {
        const requests = checks.map((check) => ({
            entity: check.entity,
            action: check.action,
            resource: check.resource,
            context: check.context,
        }));

        const response = await this.request<{ results: EvaluateResponse[] }>(
            'POST',
            '/v1/batch-evaluate',
            { requests }
        );

        return response.results.map((r) => ({
            decision: r.decision,
            reason: r.reason,
            matchedPolicy: r.matchedPolicy,
            evaluatedAt: new Date(r.evaluatedAt),
            latencyMs: r.latencyMs,
        }));
    }

    /**
     * Clear the decision cache
     */
    async clearCache(): Promise<void> {
        if (this.cache) {
            await this.cache.clear();
            this.log('Cache cleared');
        }
    }

    /**
     * Invalidate a specific cache entry
     */
    async invalidateCache(options: CheckOptions): Promise<void> {
        if (this.cache) {
            const cacheKey = this.getCacheKey(options);
            await this.cache.delete(cacheKey);
            this.log('Cache invalidated for', cacheKey);
        }
    }

    private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const requestId = generateRequestId();

        this.log(`${method} ${path}`, body);

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                        'X-Request-Id': requestId,
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = (await response.json().catch(() => ({}))) as {
                        message?: string;
                        code?: string;
                    };
                    throw new AccessForgeError(
                        errorData.message || `HTTP ${response.status}`,
                        errorData.code || 'API_ERROR',
                        response.status
                    );
                }

                const data = (await response.json()) as T;
                this.log(`Response:`, data);
                return data;
            } catch (error) {
                lastError = error as Error;

                // Don't retry on client errors (4xx)
                if (error instanceof AccessForgeError && error.statusCode && error.statusCode < 500) {
                    throw error;
                }

                this.log(`Attempt ${attempt + 1} failed:`, error);

                // Exponential backoff
                if (attempt < this.retries - 1) {
                    const delay = Math.pow(2, attempt) * 100;
                    this.log(`Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new AccessForgeError('Request failed', 'REQUEST_FAILED');
    }
}

// ============================================
// Exports
// ============================================

// Re-export types from core
export type { Entity, Resource, Action, DecisionResult, Decision, EvaluateRequest, EvaluateResponse };

// Default export
export default AccessForge;
