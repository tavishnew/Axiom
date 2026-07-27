# Frontend-Backend Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the project to separate frontend and backend concerns into dedicated directories while maintaining monorepo functionality.

**Architecture:** Move existing packages into logical groups: frontend (client-side apps), backend (server-side applications and databases), and shared (cross-cutting libraries). Update workspace configuration to reflect new locations.

**Tech Stack:** TypeScript, React, Node.js, PostgreSQL (via Prisma/Zod), Vite, pnpm workspace.

## Global Constraints

- Maintain all existing functionality and dependencies
- Keep pnpm workspace structure intact
- Preserve package names and versions
- Ensure all internal references remain functional
- No changes to external APIs or user-facing behavior
---
### Task 1: Create directory structure

**Files:**
- Create: `frontend/`
- Create: `backend/`
- Create: `shared/`

**Interfaces:**
- Consumes: None
- Produces: Three new directories for organizing packages

- [ ] **Step 1: Create frontend directory**
  ```bash
  mkdir frontend
  ```
- [ ] **Step 2: Verify directory created**
  ```bash
  ls -la frontend/
  ```
  Expected: Empty directory or does not error
- [ ] **Step 3: Create backend directory**
  ```bash
  mkdir backend
  ```
- [ ] **Step 4: Verify directory created**
  ```bash
  ls -la backend/
  ```
- [ ] **Step 5: Create shared directory**
  ```bash
  mkdir shared
  ```
- [ ] **Step 6: Verify directory created**
  ```bash
  ls -la shared/
  ```
- [ ] **Step 7: Commit directory creation**
  ```bash
  git add frontend backend shared
  git commit -m "chore: create frontend/backend/shared directories"
  ```

### Task 2: Move frontend application

**Files:**
- Move: `artifacts/axiom` → `frontend/axiom`
- Modify: None (direct move)
- Test: Verify moved contents

**Interfaces:**
- Consumes: Existing frontend app at `artifacts/axiom`
- Produces: Frontend app at `frontend/axiom`

- [ ] **Step 1: Verify source exists**
  ```bash
  ls -la artifacts/axiom
  ```
- [ ] **Step 2: Move directory**
  ```bash
  mv artifacts/axiom frontend/
  ```
- [ ] **Step 3: Verify move succeeded**
  ```bash
  ls -la frontend/axiom
  ```
- [ ] **Step 4: Commit move**
  ```bash
  git add artifacts/axiom frontend/axiom
  git commit -m "feat: move axiom to frontend"
  ```

### Task 3: Move backend API server

**Files:**
- Move: `artifacts/api-server` → `backend/api-server`
- Modify: None (direct move)
- Test: Verify moved contents

**Interfaces:**
- Consumes: Existing API server at `artifacts/api-server`
- Produces: API server at `backend/api-server`

- [ ] **Step 1: Verify source exists**
  ```bash
  ls -la artifacts/api-server
  ```
- [ ] **Step 2: Move directory**
  ```bash
  mv artifacts/api-server backend/
  ```
- [ ] **Step 3: Verify move succeeded**
  ```bash
  ls -la backend/api-server
  ```
- [ ] **Step 4: Commit move**
  ```bash
  git add artifacts/api-server backend/api-server
  git commit -m "feat: move api-server to backend"
  ```

### Task 4: Move shared Zod schemas

**Files:**
- Move: `lib/api-zod` → `shared/api-zod`
- Modify: None (direct move)
- Test: Verify moved contents

**Interfaces:**
- Consumes: Existing zod package at `lib/api-zod`
- Produces: Zod package at `shared/api-zod`

- [ ] **Step 1: Verify source exists**
  ```bash
  ls -la lib/api-zod
  ```
- [ ] **Step 2: Move directory**
  ```bash
  mv lib/api-zod shared/
  ```
- [ ] **Step 3: Verify move succeeded**
  ```bash
  ls -la shared/api-zod
  ```
- [ ] **Step 4: Commit move**
  ```bash
  git add lib/api-zod shared/api-zod
  git commit -m "feat: move api-zod to shared"
  ```

### Task 5: Move database package to backend

**Files:**
- Move: `lib/db` → `backend/db`
- Modify: None (direct move)
- Test: Verify moved contents

**Interfaces:**
- Consumes: Existing db package at `lib/db`
- Produces: Db package at `backend/db`

- [ ] **Step 1: Verify source exists**
  ```bash
  ls -la lib/db
  ```
- [ ] **Step 2: Move directory**
  ```bash
  mv lib/db backend/
  ```
- [ ] **Step 3: Verify move succeeded**
  ```bash
  ls -la backend/db
  ```
- [ ] **Step 4: Commit move**
  ```bash
  git add lib/db backend/db
  git commit -m "feat: move db to backend"
  ```

### Task 6: Clean up empty directories

**Files:**
- Remove: `artifacts/` (if empty)
- Remove: `lib/` (if empty)
- Modify: None
- Test: Verify directories removed

**Interfaces:**
- Consumes: Previously moved directories
- Produces: Cleaned up root directory

- [ ] **Step 1: Check if artifacts is empty**
  ```bash
  ls -la artifacts/
  ```
  Expected: Only possibly empty or non-existent
- [ ] **Step 2: Remove artifacts if empty**
  ```bash
  rmdir artifacts 2>/dev/null || echo "artifacts not empty, checking contents"
  ```
- [ ] **Step 3: Check if lib is empty**
  ```bash
  ls -la lib/
  ```
- [ ] **Step 4: Remove lib if empty**
  ```bash
  rmdir lib 2>/dev/null || echo "lib not empty, checking contents"
  ```
- [ ] **Step 5: Verify cleanup**
  ```bash
  ls -la | grep -E "artifacts|lib"
  ```
  Expected: No output (directories removed)
- [ ] **Step 6: Commit cleanup**
  ```bash
  git add .
  git commit -m "chore: remove empty artifacts and lib directories"
  ```

### Task 7: Update workspace configuration

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: None
- Test: Verify pnpm recognizes packages

**Interfaces:**
- Consumes: Current workspace configuration
- Produces: Updated workspace configuration pointing to new locations

- [ ] **Step 1: View current packages section**
  ```bash
  grep -A 4 "^packages:" pnpm-workspace.yaml
  ```
  Expected output:
  ```
  packages:
    - artifacts/*
    - lib/*
    - lib/integrations/*
    - scripts
  ```
- [ ] **Step 2: Update packages section to new locations**
  We will replace the three lines under `packages:` with the new ones.
  Since the file is small, we can use a simple sed command for each line.
  Note: We must escape the asterisks in the pattern.
  
  First, backup the file:
  ```bash
  cp pnpm-workspace.yaml pnpm-workspace.yaml.bak
  ```
  
  Replace the line for artifacts:
  ```bash
  sed -i 's/^- \*\/\*artifacts\*\/\*$/-\ \*\/\*frontend\*\/\*/' pnpm-workspace.yaml
  ```
  
  Replace the line for lib:
  ```bash
  sed -i 's/^- \*\/\*lib\*\/\*$/-\ \*\/\*backend\*\/\*/' pnpm-workspace.yaml
  ```
  
  Replace the line for lib/* (which is actually lib/integrations/*):
  ```bash
  sed -i 's/^- \*\/\*lib\/\integrations\/\*$/-\ \*\/\*shared\/\*/' pnpm-workspace.yaml
  ```
  
- [ ] **Step 3: Verify the change**
  ```bash
  grep -A 4 "^packages:" pnpm-workspace.yaml
  ```
  Expected output:
  ```
  packages:
    - frontend/*
    - backend/*
    - shared/*
    - scripts
  ```
- [ ] **Step 4: Commit the change**
  ```bash
  git add pnpm-workspace.yaml
  git commit -m "chore: update workspace package locations"
  ```

### Task 8: Verify installation

**Files:**
- Modify: None
- Create: None
- Test: Verify that pnpm install works and the project builds

**Interfaces:**
- Consumes: Updated workspace and moved packages
- Produces: Confirmed working installation

- [ ] **Step 1: Run pnpm install to ensure dependencies are resolved**
  ```bash
  pnpm install
  ```
- [ ] **Step 2: Run a quick build check (optional)**
  ```bash
  # We can run the build script for one of the packages to ensure nothing is broken
  pnpm run -r build
  ```
  Note: This may take time and is optional; we can skip if the project is large.
- [ ] **Step 3: Commit any lockfile changes**
  ```bash
  git add pnpm-lock.yaml
  git commit -m "chore: update lockfile after restructure"
  ```