# AccessForge

> Authorization infrastructure for SaaS applications

## Overview

AccessForge provides authorization as a service, combining:
- **Role-Based Access Control (RBAC)** - Traditional role permissions
- **Attribute-Based Access Control (ABAC)** - Dynamic, contextual decisions
- **Plan-Based Entitlements** - Feature gating based on subscription
- **Usage-Based Limits** - Quota enforcement and metering

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.18
- [Node.js](https://nodejs.org/) >= 18.0.0
- PostgreSQL (we recommend [Neon](https://neon.tech/))

### Installation

```bash
# Clone the repository
git clone https://github.com/permix/permix.git
cd permix

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Generate Prisma client
bun db:generate

# Run database migrations
bun db:migrate

# Start all apps in development mode
bun dev
```

### Development Commands

```bash
# Start all apps
bun dev

# Start specific app
bun dev --filter @accessforge/api
bun dev --filter @accessforge/dashboard

# Build all packages
bun build

# Run tests
bun test

# Lint code
bun lint

# Format code
bun format

# Database commands
bun db:generate     # Generate Prisma client
bun db:migrate      # Run migrations
bun db:push         # Push schema to database
bun db:studio       # Open Prisma Studio
bun db:seed         # Seed database
```

## Project Structure

```
permix/
├── apps/
│   ├── api/              # Hono API (PDP) - Bun runtime
│   ├── dashboard/        # Next.js Admin Dashboard
│   └── docs/             # Documentation site
│
├── packages/
│   ├── core/             # Shared types, constants
│   ├── db/               # Prisma schema & client
│   ├── sdk-node/         # Node.js SDK
│   └── ui/               # Shared UI components
│
├── docs/                 # Project documentation
│   ├── WHITEPAPER.md
│   └── ROADMAP.md
│
└── turbo.json            # Turborepo config
```

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + React 18 + TypeScript + Tailwind CSS |
| API | Hono (TypeScript) on Bun runtime |
| Database | Neon Postgres + Prisma ORM |
| Auth | Auth.js (NextAuth v5) |
| Deployment | Vercel (Serverless + Edge Functions) |

## Documentation

- [Whitepaper](./docs/WHITEPAPER.md) - Product vision and design
- [Roadmap](./docs/ROADMAP.md) - Implementation progress

## License

MIT
