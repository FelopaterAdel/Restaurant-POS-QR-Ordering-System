# Architecture

Turbo monorepo: `apps/backend` (Express API), `apps/frontend` (React SPA
serving staff + customer views), `packages/database` (Prisma + Postgres).

Each backend domain is a self-contained module:

```text
modules/<domain>/
  routes/        Express wiring (auth, roles, Zod validation)
  controllers/   HTTP layer (req/res only)
  use-cases/     Business rules (unit-tested with mocked repositories)
  repositories/  Prisma access (transactions live here)
  schemas/       Zod input contracts (shared error envelope)
```

Cross-module calls go use-case → use-case or use-case → repository, never
controller → controller. Side effects (notifications, audit, loyalty,
stock deduction) run best-effort after the primary commit so operations
flows (kitchen, cashier) never break on auxiliary failures.

Key flows:

- Order: `POST /public/orders` → items priced server-side → coupon/tip →
  optional online intent → queue → status FSM → payment (full, split, or
  online webhook) → complete → loyalty award.
- Inventory: `CONFIRMED → PREPARING` deducts recipe quantities in one
  transaction; threshold crossings notify OWNER/MANAGER.
- Money safety: split payments serialize on a row-locked order row with a
  remaining-balance check; coupons re-validate inside the creation
  transaction; refunds need manager approval and void atomically.

Frontend features mirror the backend modules (`features/*` with
`api/queries/mutations/page`), TanStack Query for server state, role
routes + `canAccess` matrix for RBAC, MSW for tests.

Upgrade paths: swap polling for Socket.io rooms per restaurant; extract
the AI report scheduler into a worker; add read replicas behind the
repository layer.
