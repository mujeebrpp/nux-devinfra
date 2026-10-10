# MVP Delivery Milestones

This sequence assumes one primary developer using coding assistance.
It is a planning estimate, not a commitment.

## Phase 0 — Stabilize infrastructure (Week 1)

**Goal:** a clean checkout builds and runs everything.

Tasks:
- Resolve PostgreSQL port and environment-file inconsistencies
  (`status.ps1` hardcodes 5432 while the machine uses 5433).
- Add destructive database safeguards (reset requires explicit
  confirmation; CI and tests only use `*_test` databases).
- Validate Prisma schema and migration commands for all three apps.
- Confirm clean dependency installation (committed lockfiles) and
  production auth behaviour.
- Establish GitHub Actions (build, database checks, tests).
- Standardize NuxFarm API: `/api` global prefix, Jest config with
  test-database safety contract, project README; consolidate the
  double init migration history.
- Add `scripts/migrate-all.ps1` and `scripts/seed-all.ps1` for the
  three development databases; extend `reset.ps1` to re-migrate and
  re-seed after a volume reset.

**Exit gate:** infrastructure and all app builds work from a clean
checkout.

## Phase 1 — NuxWell vertical slice (Weeks 2–3)

**Goal:** first production-shaped business workflow.

Tasks:
- Bookings API module: availability lookup, booking creation with
  transactional capacity/overlap enforcement, cancellation with
  ownership and status rules.
- Session auth middleware (Neon Auth cookie → local `User` via
  `authSubjectId`) and role guards.
- Admin facility/service management endpoints behind the guard.
- Web: facility detail → availability → booking creation flow;
  dashboard booking history with cancellation; loading, empty,
  validation and error states.
- Jest e2e tests for conflict, overbooking, validation and
  authorization; Playwright end-to-end booking journey; seed update.

**Exit gate:** a customer can complete the booking workflow against
a real test database.

## Phase 2 — NuxFarm vertical slice (Weeks 4–5)

**Goal:** farm operations workflow.

Tasks:
- Standardize the existing farm API, schema and validation
  (Phase 0 items applied to NuxFarm).
- CSV/JSON import endpoint: schema validation, dry-run preview,
  per-row error reporting, commit on confirmation.
- Role-based access control (platform admin vs farm admin).
- Dashboard page: active crop cycles, upcoming tasks, overdue tasks.
- Task generation from templates; Jest tests with safety contract;
  project README.

**Exit gate:** the farm admin can manage an active crop cycle
without manually editing the database.

## Phase 3 — NuxCafe vertical slice (Weeks 6–7)

**Goal:** kitchen operations workflow.

Tasks:
- Role-based kitchen/admin access enforcement on the API.
- Low-stock warning verification and dashboard surfacing.
- Cancellation and failure-path tests (insufficient stock, concurrent
  completion attempts).
- Finish documentation and deployment configuration.

**Exit gate:** an order can be processed and ingredient usage
reconciles correctly.

## Phase 4 — Integration and release (Week 8)

**Goal:** all three applications pass acceptance and deploy
independently.

Tasks:
- Test all six web/API ports, seed/test isolation, authentication,
  deployment configuration, database migrations, error handling and
  recovery instructions.
- Smoke and acceptance test pass across all three applications.
- Deployment runbooks finalized; rollback path verified.

**Exit gate:** all three apps pass the agreed smoke and acceptance
tests, and each can be deployed independently.

## Epic mapping

| Epic | Phase |
|---|---|
| INF-1 Infrastructure hardening | 0 |
| INF-2 Environment and database safety | 0 |
| INF-3 CI build and test pipeline | 0 |
| NW-1 Facilities and services | 1 |
| NW-2 Availability and booking integrity | 1 |
| NW-3 Customer dashboard and admin | 1 |
| NF-1 Farm locations and crop cycles | 2 |
| NF-2 Tasks and irrigation logs | 2 |
| NC-1 Ingredients, recipes and menu | 3 (done) |
| NC-2 Orders, production and stock | 3 (done; guards + tests remain) |
| REL-1 Security, smoke tests and release | 4 |
