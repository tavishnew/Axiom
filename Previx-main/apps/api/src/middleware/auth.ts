// Authentication Middleware
// =========================

import { MiddlewareHandler } from 'hono';
import { prisma } from '@accessforge/db';
import { createHash } from 'crypto';

// Hash function for API key comparison
function hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
}

export interface AuthContext {
    organizationId: string;
    apiKeyId: string;
    apiKeyName: string;
}

declare module 'hono' {
    interface ContextVariableMap {
        auth: AuthContext;
        requestId: string;
    }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
        return c.json(
            {
                error: {
                    message: 'Missing Authorization header',
                    code: 'UNAUTHORIZED',
                },
            },
            401
        );
    }

    // Extract Bearer token
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return c.json(
            {
                error: {
                    message: 'Invalid Authorization header format. Use: Bearer <api_key>',
                    code: 'UNAUTHORIZED',
                },
            },
            401
        );
    }

    const apiKey = match[1];
    const hashedKey = hashApiKey(apiKey);

    try {
        // Look up API key in database
        const keyRecord = await prisma.apiKey.findUnique({
            where: { hashedKey },
            include: { organization: true },
        });

        if (!keyRecord) {
            return c.json(
                {
                    error: {
                        message: 'Invalid API key',
                        code: 'UNAUTHORIZED',
                    },
                },
                401
            );
        }

        // Check if key is expired
        if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
            return c.json(
                {
                    error: {
                        message: 'API key has expired',
                        code: 'UNAUTHORIZED',
                    },
                },
                401
            );
        }

        // Update last used timestamp (non-blocking)
        prisma.apiKey
            .update({
                where: { id: keyRecord.id },
                data: { lastUsedAt: new Date() },
            })
            .catch(() => {
                // Ignore errors for non-critical update
            });

        // Set auth context
        c.set('auth', {
            organizationId: keyRecord.organizationId,
            apiKeyId: keyRecord.id,
            apiKeyName: keyRecord.name,
        });

        await next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return c.json(
            {
                error: {
                    message: 'Authentication failed',
                    code: 'AUTH_ERROR',
                },
            },
            500
        );
    }
};
