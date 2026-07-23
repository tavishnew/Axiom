// Permix API - Main Entry Point
// ==============================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { generateRequestId } from '@permix/core';

import { v1Routes } from './routes/v1';

const app = new Hono();

// ============================================
// Global Middleware
// ============================================

// CORS configuration - restrict to allowed origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'];

app.use(
    '*',
    cors({
        origin: (origin) => {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) return true;
            
            // Check if origin is in allowed list
            return allowedOrigins.includes(origin);
        },
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
        credentials: true,
    })
);

// Request logging
app.use('*', logger());

// Pretty JSON responses in development
app.use('*', prettyJSON());

// Add request ID to all responses
app.use('*', async (c, next) => {
    const requestId = c.req.header('x-request-id') || generateRequestId();
    c.set('requestId', requestId);
    c.res.headers.set('x-request-id', requestId);
    await next();
});

// Security headers middleware
app.use('*', async (c, next) => {
    await next();
    
    // Security headers
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('X-XSS-Protection', '1; mode=block');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS in production
    if (process.env.NODE_ENV === 'production') {
        c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Content Security Policy (basic)
    c.res.headers.set('Content-Security-Policy', "default-src 'self'");
});

// ============================================
// Health & Status Routes (No Auth)
// ============================================

app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/', (c) => {
    return c.json({
        name: 'Permix API',
        version: '0.1.0',
        docs: 'https://docs.permix.io',
        endpoints: {
            health: 'GET /health',
            evaluate: 'POST /v1/evaluate',
            batchEvaluate: 'POST /v1/batch-evaluate',
            policies: 'GET /v1/policies',
        },
    });
});

// ============================================
// API v1 Routes (With Auth)
// ============================================

app.route('/v1', v1Routes);

// ============================================
// Error Handling
// ============================================

app.onError((err, c) => {
    console.error('API Error:', err);

    const requestId = c.get('requestId') || 'unknown';

    return c.json(
        {
            error: {
                message: err.message || 'Internal server error',
                code: 'INTERNAL_ERROR',
                requestId,
            },
        },
        500
    );
});

app.notFound((c) => {
    return c.json(
        {
            error: {
                message: 'Not found',
                code: 'NOT_FOUND',
            },
        },
        404
    );
});

// ============================================
// Server Start
// ============================================

const port = process.env.API_PORT || 3001;

console.log(`🚀 Permix API running on http://localhost:${port}`);

export default {
    port,
    fetch: app.fetch,
};
