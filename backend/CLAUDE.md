# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JiNANAM is a multi-tenant SaaS REST API built with **Node.js + TypeScript + Express.js** to digitize and unify the global Jain community ecosystem. It covers members, temples, dharamshalas, monks, events, bookings, donations, tracking, and more across 48 business modules.

## Commands

```bash
# Development
npm run dev              # Start API with hot reload (tsx watch src/server.ts)
npm run worker           # Start BullMQ worker with hot reload

# Build & Lint
npm run build            # Compile TypeScript to dist/
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
npm run format           # Prettier format

# Testing
npm test                 # All tests
npm run test:unit        # Unit tests only (no DB required)
npm run test:integration # Integration tests (requires running DB + Redis)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Database
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Create and apply new migration (dev)
npm run prisma:migrate:deploy  # Apply pending migrations (prod/staging)
npm run prisma:studio    # Open Prisma Studio GUI
npm run seed             # Seed roles, master data, Super Admin

# Production
npm run start            # Run compiled API (dist/)
npm run start:worker     # Run compiled BullMQ worker
npm run clean:db         # Clear dummy/test data from DB
```

**Run a single test file:**
```bash
npx jest src/path/to/test.spec.ts
npx jest --testNamePattern="pattern" # Filter by test name
```

## Architecture

### Request Pipeline

Every authenticated route passes through this middleware stack:

```
Helmet/CORS/Compression/Pino logging
  → Redis-backed rate limiter
  → requireAuth        — verifies JWT, attaches req.user
  → requirePermission  — RBAC check (role defaults + per-user/org overrides)
  → scopeToOrganization — multi-tenant isolation; rejects cross-tenant access
  → Zod validation     — body/query/params validated, 422 on failure
  → Controller → Service → Prisma
  → Global audit middleware — logs every successful authenticated mutation
```

### Module Structure

All 48 business modules live under `src/modules/<module>/` and each follows:
- `<module>.routes.ts` — Express router with `requirePermission` + `validateRequest` per endpoint
- `<module>.controller.ts` — Thin layer: calls service, returns `apiResponse`
- `<module>.service.ts` — Business logic using Prisma client
- `<module>.schemas.ts` — Zod schemas for request validation
- `<module>.types.ts` — TypeScript interfaces/types (optional)

Routes are registered in `src/routes/index.ts`.

### Engines (`src/engines/`)

Reusable cross-cutting services required by most modules:

| Engine | Purpose |
|---|---|
| `idGenerator` | Concurrency-safe sequential public IDs (e.g. JFJT108) via `SELECT FOR UPDATE` |
| `rbac` | JWT verification + permission resolution (role matrix + per-user/org overrides) |
| `visibility` | Community-chain + geo-expansion eligibility resolver for content visibility |
| `notification` | Channel adapters: Push → WhatsApp → SMS → Email with automatic failover |
| `audit` | Immutable audit trail — records before/after diffs, redacts sensitive fields |
| `qr` | HMAC-signed QR payloads for tickets, staff, visitors, certificates |
| `export` | Unified PDF/Excel/CSV export for all report endpoints |
| `encryption` | AES-256-GCM field-level encryption for PII (Aadhaar, PAN, bank details) |

### Key Invariants

These are architectural rules enforced throughout — do not violate them when adding features:

1. **Soft deletes only.** All entity tables have `deletedAt`/`deletedById`. Hard-delete APIs do not exist (blocked at Super Admin level only).
2. **Every mutation is audited.** The global audit middleware handles this; services don't need to log manually.
3. **Public IDs are immutable and never reused.** Always generate via `idGenerator` engine for user-facing IDs.
4. **Multi-tenant isolation.** Every org-scoped query must filter by `organizationId`. The `scopeToOrganization` middleware enforces this at the route level.
5. **Encrypt PII at the service layer.** Aadhaar/PAN/bank details must be encrypted before writing and decrypted after reading using the `encryption` engine.
6. **Aadhaar deduplication uses HMAC-SHA256 lookup hash**, not the encrypted value, to prevent duplicates without decrypting.
7. **All DB tables include audit fields:** `createdAt`, `updatedAt`, `createdById`, `updatedById`.

### Background Jobs (BullMQ)

Workers live in `src/jobs/` and are started separately (`npm run worker`). Jobs include payment window countdowns, seat lock expiry, offer archival, event reminders, tithi notifications, certificate generation, and feed activation. Wire new jobs by adding a queue definition and processor in `src/jobs/`.

### Real-time (Socket.IO)

Three namespaces in `src/sockets/`:
- `/tracking` — Monk location tracking
- `/dashboards` — Live dashboard counters
- `/visitors` — Visitor check-ins

All namespaces are auth-gated (JWT on handshake) and org-scoped.

## Database

- **ORM:** Prisma 5.20 with PostgreSQL 15+
- **Schema:** `prisma/schema.prisma` (100+ models)
- **Migrations:** `prisma/migrations/` — always use `prisma migrate dev` during development, never edit migration files directly
- **Redis 7** for OTP storage, BullMQ queues, rate limiting, and seat locks

After any schema change: `npm run prisma:generate` to regenerate the client.

## Environment

All variables are Zod-validated at boot in `src/config/env.ts`. Reference `.env.example` for all required keys. Critical groups:
- `DATABASE_URL`, `REDIS_URL` — required for any runtime
- `ACCESS_SECRET`, `REFRESH_SECRET` — JWT signing
- `FIELD_ENCRYPTION_KEY` — AES-256-GCM for PII columns
- `QR_SIGNING_SECRET` — HMAC for QR payloads
- `MSG91_*` — OTP delivery (WhatsApp/SMS/Email)

## TypeScript

- Path alias `@/*` maps to `src/*` (configured in `tsconfig.json` and resolved at build by `tsc-alias`)
- Strict mode enabled — no implicit `any`, strict null checks
- Express `Request` is augmented in `src/types/express.d.ts` to include `req.user`, `req.organization`, `req.permissions`

## Testing Conventions

- Unit tests (`tests/unit/`) test engines and utilities with no database dependency
- Integration tests (`tests/integration/`) require live PostgreSQL + Redis; gated behind `RUN_INTEGRATION=1` env var
- Use `supertest` for HTTP integration tests against the Express app

## Production Deployment

- **Docker:** `docker-compose.yml` runs API + Worker + PostgreSQL 15 + Redis 7 with healthchecks
- **PM2:** `ecosystem.config.js` — API in cluster mode (max instances), worker in fork mode; graceful shutdowns configured
- Run `npm run prisma:migrate:deploy` before starting the API in production

## Key Architecture Decisions (`DECISIONS.md`)

1. **Public ID scheme** — Sequential, org-prefixed (e.g. JFJT108), never reused, generated with SELECT FOR UPDATE
2. **OTP delivery** — MSG91 WhatsApp first, SMS fallback, Email last resort
3. **Geo queries** — PostGIS extension used for radius-based temple/dharamshala search
4. **Gaccha list** — 83 well-known Jain sect branches seeded as master data
5. **Seat locks** — Redis TTL-based holds, released by BullMQ job on expiry
6. **Suspicious login** — Flagged on >3 distinct devices in 24h or ≥5 failed attempts
7. **Payment gateway** — Razorpay as primary abstraction layer
