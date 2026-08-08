# Axiom

RBAC/ABAC authorization platform with per-entity policy scoping, versioned policies, and sub-millisecond evaluation.

Built with Express 5, Drizzle ORM, PostgreSQL, React 19, Vite 7, Tailwind 4.

---

## Quick Start

```bash
# Prerequisites: Node 24+, pnpm 11+, PostgreSQL 17
# Configure DATABASE_URL in .env (see .env.example)

pnpm install
pnpm --filter @workspace/db run push    # apply schema to Postgres
pnpm dev                               # starts frontend (3002) + backend (8080)
```

Frontend: `http://localhost:3002`  
Backend:  `http://localhost:8080`

---

## Architecture

```
Axiom/
├── backend/                    # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── axiom.ts        # main router (~1300 lines)
│   │   │   ├── health.ts       # /healthz + /healthz/detailed
│   │   │   └── metrics.ts      # Prometheus /metrics + /metrics/summary
│   │   ├── lib/
│   │   │   ├── env.ts          # validated env (Zod)
│   │   │   └── policy-evaluator.ts
│   │   └── app.ts              # CORS, cookie-parser, router mount
│   ├── db/                     # Drizzle schema + connection
│   │   └── src/schema/*.ts     # one file per table
│   └── dist/                   # bundled output (vite-node)
├── frontend/                   # React SPA (Vite)
│   └── src/
│       ├── app/                # wouter routes (pages)
│       │   ├── auth/           # sign-in, sign-up
│       │   ├── dashboard/      # dashboard overview
│       │   ├── policies/       # policy CRUD + condition builder
│       │   ├── entities/       # entities + policy assignment
│       │   ├── resources/      # resource CRUD
│       │   ├── decisions/      # audit log with filters/latency
│       │   ├── test/           # live eval console + SDK snippet
│       │   ├── settings/       # org, billing, team, profile, API keys
│       │   └── landing/        # marketing landing page
│       ├── components/         # shadcn/ui + custom (DashboardLayout, Sidebar, TableSkeleton)
│       └── lib/
│           ├── api.ts          # typed API client (hand-written)
│           └── auth.tsx        # AuthProvider + ProtectedRoute
├── shared/
│   └── api-zod/                # shared Zod contracts (types + responses)
├── scripts/                    # repo tooling
├── nginx/                      # nginx configs (dev + prod)
├── docker-compose.yml          # dev stack
└── docker-compose.prod.yml     # prod stack (multi-stage builds)
```

---

## Core Concepts

| Concept | Implementation |
|---------|---------------|
| **Auth** | Session cookies (httpOnly, 7d) + API keys (`ak_...`, SHA-256) |
| **Tenancy** | Every request scoped to `req.user.organizationId` from session |
| **Policies** | Priority + conditions (equals/in/gt/lt/contains/exists), dot-notation context, default-deny |
| **Per-entity scoping** | `policy_assignments` table; evaluation left-joins org-wide + assigned policies, highest priority wins |
| **Versioning** | `policy_versions` snapshots on every change; full diff history |
| **IDs** | `genId()` → `ax_${randomUUID()}` prefix for all PKs |
| **Team** | Invitations table with token/expiry; role-based member management |
| **Billing** | Stripe Checkout + Billing Portal + webhook sync (optional) |

---

## API Endpoints

All routes except `/healthz`, `/healthz/detailed`, `/metrics`, `/metrics/summary`, and `/auth/*` require session cookie.  
`/v1/evaluate` uses Bearer `ak_...` API key auth.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/sign-in` | — | Create session cookie |
| POST | `/auth/sign-up` | — | Register org + user |
| POST | `/auth/sign-out` | Cookie | Destroy session |
| GET | `/auth/session` | Cookie | Current user (or null) |
| GET | `/auth/profile` | Cookie | Current user profile |
| PATCH | `/auth/profile` | Cookie | Update name/avatar |
| POST | `/auth/change-password` | Cookie | Change password (revokes other sessions) |
| GET | `/auth/sessions` | Cookie | List active sessions |
| DELETE | `/auth/sessions/:id` | Cookie | Revoke a session |
| GET | `/organizations` | Cookie | Current org |
| GET/PATCH | `/organizations/:id` | Cookie | Get/update org (scoped) |
| GET | `/policies` | Cookie | List with pagination, search, filter, sort |
| GET | `/policies/:id` | Cookie | Get single policy |
| POST | `/policies` | Cookie | Create policy |
| PATCH | `/policies/:id` | Cookie | Update policy (snapshots to versions) |
| DELETE | `/policies/:id` | Cookie | Delete policy (blocks if assigned) |
| GET | `/policies/:id/versions` | Cookie | Version history |
| GET | `/entities` | Cookie | List with pagination, search, filter, sort |
| GET/PATCH/DELETE | `/entities/:id` | Cookie | Entity CRUD |
| POST | `/entities` | Cookie | Create entity |
| GET | `/entities/:id/policies` | Cookie | List assigned policies |
| POST | `/entities/:id/policies` | Cookie | Assign policy to entity |
| DELETE | `/entities/:id/policies/:policyId` | Cookie | Remove assignment |
| GET | `/resources` | Cookie | List with pagination, search, filter, sort |
| GET/PATCH/DELETE | `/resources/:id` | Cookie | Resource CRUD |
| POST | `/resources` | Cookie | Create resource |
| GET | `/decisions` | Cookie | Audit log (rich filters, pagination) |
| POST | `/decisions/evaluate` | Cookie | Evaluate policy (for UI) |
| GET | `/api-keys` | Cookie | List API keys (opt include revoked) |
| POST | `/api-keys` | Cookie | Create API key (returns raw key once) |
| GET | `/api-keys/:id` | Cookie | Get API key metadata |
| DELETE | `/api-keys/:id` | Cookie | Soft-revoke API key |
| GET | `/team` | Cookie | List org members |
| POST | `/team/invite` | Cookie | Invite member (creates invitation + token) |
| PATCH | `/team/:id` | Cookie | Update member role |
| DELETE | `/team/:id` | Cookie | Remove member |
| GET | `/billing/subscription` | Cookie | Current Stripe subscription |
| POST | `/billing/checkout` | Cookie | Create Checkout session |
| POST | `/billing/portal` | Cookie | Create Billing Portal session |
| POST | `/billing/webhook` | Stripe sig | Stripe webhook (syncs subscription status) |
| POST | `/v1/evaluate` | Bearer `ak_...` | Policy evaluation (for services) |
| GET | `/healthz` | — | Basic health check (DB ping, 2s timeout) |
| GET | `/healthz/detailed` | — | Detailed health (DB latency, memory, uptime, version) |
| GET | `/metrics` | — | Prometheus exposition format |
| GET | `/metrics/summary` | — | JSON summary (request count, error rate, avg latency) |

---

## Frontend Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page (marketing) |
| `/landing` | Landing page (alias) |
| `/auth/sign-in` | Sign in |
| `/auth/sign-up` | Sign up |
| `/dashboard` | Dashboard overview (stats, quick links) |
| `/policies` | Policy list, create/edit with condition builder |
| `/entities` | Entities + policy assignment dialog |
| `/resources` | Resource CRUD |
| `/decisions` | Audit log with filters, latency display |
| `/test` | Live evaluation console (Copy SDK snippet) |
| `/settings` | Org, API keys, Team, Billing, Profile tabs |
| `/settings/billing` | Subscription management (if Stripe configured) |
| `/settings/team` | Member roles + invitations |
| `/settings/profile` | Password, sessions, avatar |

---

## Development

```bash
# Typecheck all packages
pnpm run typecheck

# Build all packages
pnpm run build

# DB schema push (dev)
pnpm --filter @workspace/db run push

# Lint
pnpm --filter @workspace/backend run lint
pnpm --filter @workspace/frontend run lint

# Run backend tests
pnpm --filter @workspace/backend run test

# Dev with hot reload
pnpm dev
```

---

## Docker (Production)

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Run stack (PostgreSQL + backend + frontend via nginx)
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

Production stack uses multi-stage builds, nginx reverse proxy, and non-root containers.

---

## Security Notes

- **Passwords**: bcrypt 12 rounds
- **API keys**: SHA-256 stored, raw key returned only once on creation
- **Sessions**: httpOnly, Secure (prod), SameSite=lax, 7-day TTL
- **Rate limiting**: 10 req/min sign-in, 5 req/min sign-up per IP
- **CORS**: explicit allow-list in `backend/src/app.ts`
- **Health check**: `/healthz` runs `SELECT 1` with 2s timeout
- **Invitations**: token-based, 7-day expiry, single-use
- **Stripe webhooks**: signature-verified, idempotent subscription sync

---

## Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | yes | — | `postgresql://user:pass@host:5432/axiom` (dev) |
| `POSTGRES_DB` | prod | — | Database name (prod) |
| `POSTGRES_USER` | prod | — | Database user (prod) |
| `POSTGRES_PASSWORD` | prod | — | Database password (prod) |
| `PORT` | no | `8080` | Backend port |
| `NODE_ENV` | no | `development` | `production` enables secure cookies |
| `VITE_API_URL` | no | `http://localhost:8080` | Frontend API base |
| `FRONTEND_URL` | no | `http://localhost:3002` | Frontend origin (CORS + Stripe redirects) |
| `JWT_SECRET` | prod | — | Min 32 chars, for tokens if used |
| `COOKIE_SECRET` | prod | — | Min 32 chars, for session signing |
| `STRIPE_SECRET_KEY` | optional | — | Enables billing features |
| `STRIPE_WEBHOOK_SECRET` | optional | — | Validates Stripe webhooks |
| `STRIPE_PRICE_PRO` | optional | — | Price ID for Pro tier |
| `STRIPE_PRICE_ENTERPRISE` | optional | — | Price ID for Enterprise tier |

Copy `.env.example` to `.env` for development. Use `.env.production.example` template for production.

---

## Policy Evaluation Logic

1. Fetch all active **org-wide** policies (no `policy_assignments` row) + policies **assigned to the entity**
2. Sort by `priority` descending
3. First policy where **ALL conditions match** wins (`effect: "allow"` or `"deny"`)
4. Default: `deny` if no match

Conditions support: `equals`, `not_equals`, `in`, `not_in`, `contains`, `not_contains`, `exists`, `not_exists`, `gt`, `lt`, `gte`, `lte`  
Dot-notation fields: `subject.plan`, `resource.owner_id`, `entity.attributes.role`, etc.

---

## License

MIT