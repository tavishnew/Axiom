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
pnpm dev                               # starts frontend (3000) + backend (8080)
```

Frontend: `http://localhost:3000`  
Backend:  `http://localhost:8080`

---

## Architecture

```
Axiom/
├── backend/                    # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── axiom.ts        # single router (~900 lines)
│   │   │   └── health.ts
│   │   └── app.ts              # CORS, cookie-parser, router mount
│   └── db/                     # Drizzle schema + connection
│       └── src/schema/*.ts     # one file per table
├── frontend/                   # React SPA (Vite)
│   └── src/
│       ├── app/                # wouter routes (pages)
│       ├── components/         # shadcn/ui + custom
│       └── lib/
│           ├── api.ts          # typed API client (hand-written)
│           └── auth.tsx        # AuthProvider + ProtectedRoute
├── shared/
│   └── api-zod/                # shared Zod contracts
└── scripts/                    # repo tooling
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

---

## API Endpoints

All routes except `/healthz` and `/auth/*` require session cookie.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/sign-up` | — | Register org + user |
| POST | `/auth/sign-in` | — | Create session cookie |
| POST | `/auth/sign-out` | Cookie | Destroy session |
| GET | `/auth/session` | Cookie | Current user |
| GET | `/organizations` | Cookie | Current org |
| GET/POST/PATCH/DELETE | `/policies` | Cookie | CRUD + versioning |
| GET | `/policies/:id/versions` | Cookie | Version history |
| GET/POST/PATCH/DELETE | `/entities` | Cookie | User/service/api_key entities |
| POST | `/entities/:id/policies` | Cookie | Assign policy to entity |
| DELETE | `/entities/:id/policies/:policyId` | Cookie | Remove assignment |
| GET/POST/PATCH/DELETE | `/api-keys` | Cookie | API key management (soft-revoke) |
| POST | `/v1/evaluate` | Bearer `ak_...` | Policy evaluation (for services) |
| POST | `/decisions/evaluate` | Cookie | Policy evaluation (for UI) |
| GET | `/decisions` | Cookie | Decision audit log |

---

## Frontend Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard (stub) |
| `/policies` | Policy list, create/edit with condition builder |
| `/entities` | Entities + policy assignment dialog |
| `/resources` | Resource CRUD |
| `/decisions` | Audit log with latency |
| `/test` | Live evaluation console (Copy SDK snippet) |
| `/settings` | Org, API keys, team, billing, profile tabs |
| `/auth/sign-in\|sign-up` | Auth flows |

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
```

---

## Security Notes

- **Passwords**: bcrypt 12 rounds
- **API keys**: SHA-256 stored, raw key returned only once on creation
- **Sessions**: httpOnly, Secure (prod), SameSite=lax, 7-day TTL
- **Rate limiting**: 10 req/min sign-in, 5 req/min sign-up per IP
- **CORS**: explicit allow-list in `backend/src/app.ts`
- **Health check**: `/healthz` runs `SELECT 1` with 2s timeout

---

## Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | yes | — | `postgresql://user:pass@host:5432/axiom` |
| `PORT` | no | `8080` | Backend port |
| `NODE_ENV` | no | `development` | `production` enables secure cookies |
| `VITE_API_URL` | no | `http://localhost:8080` | Frontend API base |

---

## License

MIT