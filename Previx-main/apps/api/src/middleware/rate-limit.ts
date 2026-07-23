// Rate Limiting Middleware
// ========================

import { MiddlewareHandler } from 'hono';

// Simple in-memory rate limiter
// For production, use Redis-based rate limiting
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
};

export function rateLimitMiddleware(config: Partial<RateLimitConfig> = {}): MiddlewareHandler {
    const { windowMs, maxRequests } = { ...defaultConfig, ...config };

    return async (c, next) => {
        // Get identifier (API key or IP)
        const auth = c.get('auth');
        const identifier = auth?.apiKeyId || c.req.header('x-forwarded-for') || 'anonymous';

        const now = Date.now();
        const entry = rateLimitStore.get(identifier);

        // Clean up expired entries periodically
        if (rateLimitStore.size > 10000) {
            for (const [key, val] of rateLimitStore.entries()) {
                if (val.resetAt < now) {
                    rateLimitStore.delete(key);
                }
            }
        }

        if (!entry || entry.resetAt < now) {
            // New window
            rateLimitStore.set(identifier, {
                count: 1,
                resetAt: now + windowMs,
            });
        } else if (entry.count >= maxRequests) {
            // Rate limit exceeded
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

            c.res.headers.set('X-RateLimit-Limit', maxRequests.toString());
            c.res.headers.set('X-RateLimit-Remaining', '0');
            c.res.headers.set('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString());
            c.res.headers.set('Retry-After', retryAfter.toString());

            return c.json(
                {
                    error: {
                        message: 'Rate limit exceeded',
                        code: 'RATE_LIMIT_EXCEEDED',
                        retryAfter,
                    },
                },
                429
            );
        } else {
            // Increment counter
            entry.count++;
        }

        // Set rate limit headers
        const currentEntry = rateLimitStore.get(identifier)!;
        c.res.headers.set('X-RateLimit-Limit', maxRequests.toString());
        c.res.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - currentEntry.count).toString());
        c.res.headers.set('X-RateLimit-Reset', Math.ceil(currentEntry.resetAt / 1000).toString());

        await next();
    };
}
