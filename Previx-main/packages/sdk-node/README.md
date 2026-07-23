# @permix/sdk

> Official Node.js SDK for Permix - Authorization as a Service

## Installation

```bash
npm install @permix/sdk
# or
yarn add @permix/sdk
# or
bun add @permix/sdk
```

## Quick Start

```typescript
import Permix from '@permix/sdk';

// Initialize the client
const permix = new Permix({
  apiKey: 'your-api-key',
});

// Check if a user can perform an action
const allowed = await permix.can({
  entity: {
    id: 'user-123',
    type: 'user',
    attributes: { plan: 'pro', role: 'member' },
  },
  action: 'read',
  resource: {
    type: 'document',
    id: 'doc-456',
  },
});

if (allowed) {
  // Grant access
} else {
  // Deny access
}
```

## API Reference

### `new Permix(config)`

Create a new Permix client.

```typescript
const permix = new Permix({
  apiKey: 'your-api-key',     // Required
  baseUrl: 'https://api.permix.io', // Optional
  timeout: 5000,              // Optional (ms)
  retries: 3,                 // Optional
  debug: false,               // Optional
  cache: {
    enabled: true,            // Optional
    ttlMs: 60000,             // Optional (1 minute)
    maxEntries: 1000,         // Optional
  },
});
```

### `permix.check(options)`

Check permissions and get the full decision result.

```typescript
const result = await permix.check({
  entity: { id: 'user-123', type: 'user', attributes: {} },
  action: 'write',
  resource: { type: 'document', id: 'doc-456' },
  context: { ip: '192.168.1.1' }, // Optional additional context
});

console.log(result);
// {
//   decision: 'allow',
//   reason: 'Matched policy: allow-pro-users',
//   matchedPolicy: 'allow-pro-users',
//   evaluatedAt: Date,
//   latencyMs: 5.2
// }
```

### `permix.can(options)`

Boolean helper that returns `true` if allowed, `false` if denied.

```typescript
if (await permix.can({ entity, action: 'delete', resource })) {
  await deleteResource(resource.id);
}
```

### `permix.batchCheck(checks)`

Check multiple permissions in a single request.

```typescript
const results = await permix.batchCheck([
  { entity, action: 'read', resource: doc1 },
  { entity, action: 'write', resource: doc1 },
  { entity, action: 'delete', resource: doc1 },
]);

const [canRead, canWrite, canDelete] = results.map(r => r.decision === 'allow');
```

### `permix.clearCache()`

Clear all cached decisions.

```typescript
await permix.clearCache();
```

### `permix.invalidateCache(options)`

Invalidate a specific cached decision.

```typescript
await permix.invalidateCache({
  entity: { id: 'user-123', type: 'user', attributes: {} },
  action: 'read',
  resource: { type: 'document', id: 'doc-456' },
});
```

## Caching

The SDK includes built-in caching to reduce API calls for repeated permission checks.

```typescript
const permix = new Permix({
  apiKey: 'your-api-key',
  cache: {
    enabled: true,
    ttlMs: 60000, // Cache for 1 minute
    maxEntries: 1000,
  },
});

// First call hits the API
await permix.can({ entity, action, resource }); // API call

// Second call uses cache
await permix.can({ entity, action, resource }); // Cache hit

// Force skip cache for specific check
await permix.can({ entity, action, resource, skipCache: true }); // API call
```

### Custom Cache Adapter

Implement your own cache adapter for Redis or other storage:

```typescript
import { CacheAdapter, DecisionResult } from '@permix/sdk';
import Redis from 'ioredis';

class RedisCache implements CacheAdapter {
  private redis = new Redis();

  async get(key: string): Promise<DecisionResult | undefined> {
    const data = await this.redis.get(`permix:${key}`);
    return data ? JSON.parse(data) : undefined;
  }

  async set(key: string, value: DecisionResult, ttlMs: number): Promise<void> {
    await this.redis.set(`permix:${key}`, JSON.stringify(value), 'PX', ttlMs);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(`permix:${key}`);
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys('permix:*');
    if (keys.length > 0) await this.redis.del(...keys);
  }
}

const permix = new Permix({
  apiKey: 'your-api-key',
  cache: { adapter: new RedisCache() },
});
```

## Error Handling

```typescript
import { PermixError } from '@permix/sdk';

try {
  await permix.check({ entity, action, resource });
} catch (error) {
  if (error instanceof PermixError) {
    console.error(`Permix error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Status: ${error.statusCode}`);
  }
}
```

## Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const permix = new Permix({
  apiKey: 'your-api-key',
  debug: true,
});

// Logs will appear in console:
// [Permix] POST /v1/evaluate { entity: {...}, action: 'read', ... }
// [Permix] Response: { decision: 'allow', ... }
```

## TypeScript

The SDK is written in TypeScript and includes full type definitions.

```typescript
import Permix, { Entity, Resource, DecisionResult, Decision } from '@permix/sdk';

const entity: Entity = {
  id: 'user-123',
  type: 'user',
  attributes: { plan: 'pro' },
};

const resource: Resource = {
  type: 'document',
  id: 'doc-456',
};

const result: DecisionResult = await permix.check({
  entity,
  action: 'read',
  resource,
});

const decision: Decision = result.decision; // 'allow' | 'deny'
```

## License

MIT
