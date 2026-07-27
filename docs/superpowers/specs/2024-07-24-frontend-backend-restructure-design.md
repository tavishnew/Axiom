# Frontend-Backend Restructure Design

## Purpose
Restructure the project to have separate frontend and backend directories for clarity and ease of running.

## Current Structure
- artifacts/
  - axiom/ (frontend app)
  - api-server/ (backend API)
- lib/
  - api-zod/ (shared Zod schemas)
  - db/ (database schema)
- scripts/
- pnpm-workspace.yaml

## Proposed Structure
- frontend/
  - axiom/
- backend/
  - api-server/
  - db/
- shared/
  - api-zod/
- scripts/
- pnpm-workspace.yaml (updated)

## Rationale
- Separation of concerns: frontend for client code, backend for server code.
- Shared Zod schemas accessible to both frontend and backend.
- Backend-specific database schema placed in backend/db.
- Scripts kept at root for repository-wide tooling.
- Maintains pnpm workspace benefits.

## Changes
1. Move directories as per proposed structure.
2. Update pnpm-workspace.yaml to:
   packages:
     - frontend/*
     - backend/*
     - shared/*
     - scripts
3. Update internal imports and TypeScript paths as needed.

## Open Questions
- None.