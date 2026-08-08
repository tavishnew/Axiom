import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8081';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/axiom_test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.COOKIE_SECRET = 'test-cookie-secret';

// Mock Stripe to avoid needing real credentials
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_test123' }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }),
        },
      },
      subscriptions: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => ({ type: 'test', data: { object: {} } })),
      },
    })),
  };
});

// Global test timeout
vi.setConfig({ testTimeout: 10000 });