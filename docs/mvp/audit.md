# Repository Audit (Phase 0 baseline)

**Branch:** `docs/mvp-plan`  
**Audit date:** 2026-10-10  
**Purpose:** implementation-aware baseline and ordered blocker list for the Nux Dev Infrastructure, NuxWell, NuxFarm and NuxCafe MVP programme.

This is a source review of the repository branch, not a claim that the code was installed, built, or executed during this audit. Test counts mentioned below are recorded in repository documentation/commit history and must be re-run locally or in CI before they are treated as verified.

## Executive status

| Area | Repository evidence | Current status |
|---|---|---|
| Shared local services | Compose contains PostgreSQL 17, pgAdmin, Mailpit and persistent volumes | Present; clean-checkout run still needs verification |
| NuxWell | Next.js/NestJS/Prisma project, facilities schema/API and tests; booking model exists | Partial; booking vertical slice is the main product blocker |
| NuxFarm | Full farm/cycle/task/irrigation/inventory/report domain modules, web pages and seed | Implemented baseline; import, overview dashboard, API prefix, auth and test safeguards remain |
| NuxCafe | Menu/recipe/ingredient/stock/production/order/sales modules with transactional order completion | Most complete baseline; API authorization and concurrency/failure-path assurance remain |
| CI | No workflow directory was found in the audited branch; no CI run could be verified | Release blocker |
| Production readiness | Deployment design exists in docs; live service config and auth enforcement were not validated | Not verified |

## What exists and should be retained

### Shared infrastructure

- Root `docker-compose.yml` defines PostgreSQL 17, pgAdmin and Mailpit with a PostgreSQL health check and persistent volumes.
- `postgres/init/01-databases.sql` creates the six project/environment databases: `nuxwell_dev/test`, `nuxfarm_dev/test`, `nuxcafe_dev/test`.
- PowerShell operations scripts include `up.ps1`, `down.ps1`, `status.ps1` and `reset.ps1`. The reset script is documented to require typing `RESET`.
- `.gitignore` excludes local environment files, dependencies and generated artifacts.
- There is intentionally no Redis dependency.

### NuxWell

- Prisma domain models include `User` (with `authSubjectId`), `Facility`, `Service`, `MembershipPlan` and `Booking`.
- API includes facility listing/detail and a database-backed health endpoint; web includes public pages and a facility-focused dashboard.
- Seed data and Jest/Playwright test infrastructure are present. The API test setup has a test-database safety check.
- The booking data model is not yet a completed booking product: no complete availability/create/cancel API and end-to-end customer journey were found in the earlier audit.

### NuxFarm

- Prisma domain includes farms, locations, crop cycles/stages, tasks, irrigation, inventory/transactions, reports and users.
- API modules cover farms, cycles, tasks, irrigation, inventory, reports, users and health; the web has farm, cycle, task, irrigation, inventory and report pages.
- A shared Zod validation pipe, exception filter, response interceptor, seed and smoke scripts are present.
- The current API bootstrap in `projects/nuxfarm/apps/api/src/main.ts` **does not call** `app.setGlobalPrefix("api")`. This is a confirmed source-level mismatch with the architecture standard; fix routes and smoke scripts together.
- The previously reviewed baseline lacked CSV/JSON import, an active/upcoming/overdue overview dashboard, Jest coverage with a safe test-database contract, and API auth/role enforcement. Recheck each item as implementation changes.

### NuxCafe

- Prisma domain includes ingredients, menu items, recipes/recipe items, stock movements, production, orders/order items and sales.
- API modules cover ingredients, menu, recipes, stock, production, orders, sales, dashboard and health.
- Code/documentation describes an atomic order-completion transaction for stock usage, production/order completion and sale creation. Retain this design and add failure/concurrency tests.
- The project contains web dashboards and Jest/Playwright test infrastructure. README/commit history reports Jest 9 suites / 46 tests and 13 Playwright smoke tests; these counts are **not a substitute for a current passing CI run**.
- API authorization and production auth enforcement were not established by this source review.

## Ordered blockers

| Priority | Gap / risk | Required action | Exit evidence |
|---|---|---|---|
| P0 | No CI workflow could be found or verified | Add GitHub Actions for clean install, Prisma generate/validate, builds, unit/e2e checks and Playwright smoke tests using isolated test DBs | Green workflow on the branch and a pull request |
| P0 | Test DB safety is not uniformly proven | Add/verify a fail-closed guard in every test entry point (Jest, Playwright and helper scripts); require database name suffix `_test` before migrations or cleanup | Negative test proves a dev DB URL aborts before any destructive command |
| P0 | API authorization has not been proven | Inventory every write/admin endpoint, enforce authenticated identity and role/ownership guards; fail closed in production if auth config is missing | Unauthorized and cross-tenant tests return 401/403 |
| P0 | Local/production environment behavior and port contract may drift | Validate required environment variables by `NODE_ENV`; make port/URL source explicit; do not load development env files in production | Clean-checkout startup matrix and production-config tests |
| P0 | NuxWell booking journey is incomplete | Build availability, create, customer history and cancellation; enforce capacity/overlap atomically | Parallel conflict tests and Playwright customer journey pass |
| P1 | NuxFarm route prefix differs from standards | Add `/api` prefix and update web clients and smoke scripts in the same change | Health/domain smoke tests pass on documented URLs |
| P1 | NuxFarm import and operational overview are missing from audited baseline | Add validated CSV/JSON dry-run/preview with row errors; add active/upcoming/overdue task summary | Valid and invalid import tests; UI workflow test |
| P1 | NuxFarm automated tests and README are incomplete in audited baseline | Add Jest tests, a test-DB guard and a clean setup/test README | Tests run from fresh install against `nuxfarm_test` only |
| P1 | Volume reset does not establish a seeded working state | Provide explicit migrate-all and seed-all orchestration; do not automatically wipe on setup | Documented reset-and-rebuild procedure succeeds and keeps confirmation guard |
| P1 | Migration history needs review | Inspect the two NuxFarm init migrations and keep a safe, forward-only history; do not rewrite applied history casually | Fresh DB deploy and existing local DB upgrade both documented/tested |
| P1 | NuxCafe stock/order race conditions need evidence | Add concurrent order completion, insufficient stock, cancellation and transaction rollback tests | Stock movements and on-hand balance reconcile in each test |

## Environment and infrastructure inconsistencies

1. `scripts/status.ps1` was reported in the prior audit to hard-code port 5432 while the developer's local `.env` uses 5433. Read the configured host port from `.env` and retain 5432 only for container-to-container access (for example, pgAdmin to service `postgres`).
2. `projects/nuxfarm/apps/api/src/main.ts` does not set the `/api` global prefix, unlike the NuxWell and NuxCafe bootstraps. Align the routes and all consumers.
3. NuxFarm has two init migrations in its current history (the earlier migration reportedly created a stray `HealthCheck` table and the next removed it). Do not simply delete an applied migration. Validate both clean installs and already-migrated development databases.
4. Validation approaches differ across apps (Nest class-validator pipes in some services and Zod in NuxFarm). Treat this as a documented consistency difference, not a reason to rewrite working modules in bulk.
5. The root `.env.example` currently defaults `POSTGRES_PORT=5432`; documentation notes a developer machine may use 5433. Clearly distinguish safe, shared defaults from machine-specific configuration. Never commit the actual `.env`.

## Verification protocol

Before a phase is marked complete, record the date, commit SHA, command and result for:

- clean dependency installation using the committed lockfile;
- Prisma schema validation, client generation and migration deployment into a fresh test database;
- API and web production builds;
- unit/API integration tests;
- Playwright smoke tests;
- a deliberate safety-negative test that points to a non-`_test` database and proves the test/reset operation refuses to continue.

Do not mark a test as passing merely because it is defined, included in a README, or mentioned in a commit message.

## Non-goals

- Do not rewrite all three projects just to make their code patterns identical.
- Do not add Redis, Kubernetes or a new infrastructure service for the MVP.
- Do not invent ginger hydroponic EC/pH/nutrient recommendations. Keep agronomic values out of production recipes until approved by a qualified agronomist.
- Do not perform a database reset or rewrite deployed migration history as part of documentation work.
