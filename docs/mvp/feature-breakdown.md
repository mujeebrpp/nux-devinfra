# Detailed Feature Breakdown and TODO Backlog

**Branch:** `docs/mvp-plan`  
**Purpose:** convert the MVP programme into actionable feature-level tasks.  
**Status rule:** unchecked items are planned work, not claims that a feature is absent in every current commit. Check the latest implementation and tests before opening duplicate work.

## How to use this backlog

- Work in priority order: P0 safety/release blockers, P1 MVP workflow, P2 usability/hardening, P3 deferred.
- Split a feature into small pull requests. Keep a PR focused on one feature or tightly related set of tasks.
- Before implementation, inspect the current module/schema and preserve working code. Update this file when tasks change.
- A task is done only when its acceptance checks pass on the exact commit and CI evidence is available.
- Never use a development or production database for automated tests. Every test setup must abort unless the effective database name ends in `_test`.
- No Redis. PostgreSQL/Neon remains the source of truth.

## Programme-level priority

| ID | Priority | Feature group | Depends on | Completion evidence |
|---|---|---|---|---|
| INF-01 | P0 | Local infrastructure and port/environment contract | None | Fresh checkout starts reliably |
| INF-02 | P0 | Database and test safety | INF-01 | Negative tests prove unsafe URLs abort |
| INF-03 | P0 | CI and baseline quality gates | INF-01, INF-02 | Green GitHub Actions run |
| SEC-01 | P0 | API authentication and authorization foundation | Environment/auth contract | 401/403 and resource-scope tests |
| NW-01 | P1 | Facility/service discovery and detail | INF-03 | UI/API acceptance tests |
| NW-02 | P0 | Booking lifecycle and concurrency | SEC-01, NW-01 | Parallel booking tests and Playwright journey |
| NW-03 | P1 | Customer dashboard and admin | SEC-01, NW-02 | Ownership/role tests |
| NF-01 | P1 | Farm/location/growing area/crop cycle | SEC-01, INF-03 | Farm cycle workflow test |
| NF-02 | P1 | Task planning and irrigation | NF-01 | Task lifecycle and irrigation tests |
| NF-03 | P1 | CSV/JSON import | NF-01, NF-02 | Dry-run, invalid file and idempotency tests |
| NF-04 | P1 | Operational dashboard and reports | NF-01, NF-02 | Summary values match records |
| NC-01 | P1 | Ingredients, recipes and menu | SEC-01, INF-03 | Recipe and menu workflow tests |
| NC-02 | P0 | Order, production and stock integrity | NC-01 | Rollback/concurrency/reconciliation tests |
| REL-01 | P0 | Production deployment and recovery | INF-03, SEC-01, all app gates | Release and rollback evidence |

---

# 1. Shared infrastructure

## INF-01 — Local development environment (P0)

**Goal:** every developer can start the shared dependencies from a clean checkout.

### TODO
- [ ] Validate `docker-compose.yml` with `docker compose config`.
- [ ] Confirm PostgreSQL 17, pgAdmin and Mailpit images/configuration are explicit and reproducible.
- [ ] Confirm PostgreSQL health check and pgAdmin dependency behavior.
- [ ] Confirm the persistent volume is named and its data-loss implications are documented.
- [ ] Confirm first-volume initialization creates exactly the six databases: `nuxwell_dev`, `nuxwell_test`, `nuxfarm_dev`, `nuxfarm_test`, `nuxcafe_dev`, `nuxcafe_test`.
- [ ] Document the distinction between PostgreSQL host port and container port: host defaults to 5432, container stays 5432; developer override such as 5433 must be reflected in host URLs.
- [ ] Fix `scripts/status.ps1` to read the host port from ignored local `.env` instead of hard-coding 5432.
- [ ] Confirm pgAdmin uses Docker network hostname `postgres:5432`; host applications use `localhost:<POSTGRES_PORT>`.
- [ ] Verify Mailpit UI/SMTP ports and include a test email workflow.
- [ ] Verify `scripts/up.ps1`, `down.ps1`, `status.ps1` behave consistently from Windows PowerShell.
- [ ] Document Docker Desktop WSL2 integration; do not require a second Docker daemon.
- [ ] Document first-time setup, normal startup, shutdown, health checks and troubleshooting.
- [ ] Verify no Redis container, package dependency, URL or runtime requirement has been introduced.

**Acceptance**
- [ ] A fresh checkout starts services successfully.
- [ ] All six databases are present after first initialization.
- [ ] Restarting services preserves data.
- [ ] Status output reports the configured host port correctly.
- [ ] The docs explain that `docker compose down -v` deletes all local project databases.

## INF-02 — Database lifecycle, migrations and seed safety (P0)

### TODO
- [ ] Define and document per-app commands for Prisma validation, client generation, migration deployment and seed.
- [ ] Add `scripts/migrate-all.ps1` to migrate only the three development databases.
- [ ] Add `scripts/seed-all.ps1` to seed only the three development databases.
- [ ] Make scripts stop immediately on failure and report which app/database failed.
- [ ] Make each app's seed idempotent and safe to re-run.
- [ ] Add explicit database-name validation before every test migration, cleanup or write; the database must end in `_test`.
- [ ] Validate that `NODE_ENV=test` cannot silently load `.env.local` in place of `.env.test`.
- [ ] Ensure reset commands print their target, require typed confirmation and cannot target production.
- [ ] Do not make normal startup automatically reset, migrate or seed data unexpectedly.
- [ ] Review NuxFarm's existing migration sequence on a fresh database and an already-migrated development database; preserve applied history.
- [ ] Document safe schema evolution and forward corrective migrations rather than deleting applied migrations.
- [ ] Add a deliberate negative test that uses a non-`_test` database name and proves test setup exits before touching the database.

**Acceptance**
- [ ] Dev migration and seed commands work from a fresh volume.
- [ ] Each test command refuses a dev/prod URL.
- [ ] A failure in one app is visible and does not falsely report the whole operation as successful.
- [ ] Migration history is retained and both clean install and existing-dev upgrade are tested.

## INF-03 — Continuous integration (P0)

### TODO
- [ ] Add GitHub Actions workflows for pull requests and pushes to the target branch.
- [ ] Use a committed lockfile and deterministic install command for each workspace/project.
- [ ] Pin a supported Node.js LTS version consistently with project package engines and Render configuration.
- [ ] Run lint/type-check scripts where configured.
- [ ] Run Prisma schema validation and client generation for all three APIs.
- [ ] Start a disposable PostgreSQL service for CI.
- [ ] Create/use isolated `*_test` databases only; fail before migration if database safety validation fails.
- [ ] Run API/unit tests for each app and fail if a test command silently discovers zero tests.
- [ ] Build all three web apps and all three API apps.
- [ ] Run Playwright smoke tests against local services with explicit base URLs and test environment.
- [ ] Upload Playwright traces/screenshots/logs on failure when practical.
- [ ] Report each app's result independently while failing the overall workflow if any required job fails.
- [ ] Add branch protection/required status checks after the workflow is stable.

**Acceptance**
- [ ] Green CI run is linked to the exact commit.
- [ ] A deliberately failing test fails the workflow.
- [ ] Missing test suites do not pass unnoticed.
- [ ] No production secrets are required by CI.

## INF-04 — Shared scripts and developer experience (P1)

### TODO
- [ ] Add a root command/reference table for start, stop, status, migrate, seed, test and smoke checks.
- [ ] Ensure smoke scripts use documented URLs and expected success status codes.
- [ ] Remove machine-specific absolute paths from scripts; derive paths from the repository root.
- [ ] Ensure smoke scripts return a non-zero exit code when a required endpoint fails.
- [ ] Provide an environment example per app and explain which values must be supplied locally.
- [ ] Document common errors: occupied ports, unhealthy database, missing env values, Prisma client not generated and stale migrations.

---

# 2. Shared security and API foundation

## SEC-01 — Authentication and authorization (P0)

**Goal:** the API—not just UI navigation—decides who may access each resource.

### TODO
- [ ] Inventory every controller and endpoint in all three APIs.
- [ ] Mark endpoints public, authenticated, resource-owner, farm-scoped, kitchen-scoped or admin-only.
- [ ] Define a common identity-mapping contract from Neon Auth session subject to local `User`.
- [ ] Verify missing/invalid production auth configuration causes startup or protected requests to fail closed.
- [ ] Ensure local open-auth mode is available only in explicit local development and cannot be enabled accidentally in production.
- [ ] Implement guards/decorators or equivalent API service checks for roles and ownership.
- [ ] Ensure user IDs and roles are derived from verified server-side identity, not trusted from client request bodies.
- [ ] Configure CORS from explicit environment allowlists.
- [ ] Avoid logging passwords, cookies, authorization headers, tokens or secret environment values.
- [ ] Add tests for anonymous access, wrong role, cross-user access and cross-farm/resource access.
- [ ] Document how demo/admin seed identities work without shipping production passwords.

**Acceptance**
- [ ] Unauthorized protected requests return 401.
- [ ] Authenticated users without permission return 403.
- [ ] Cross-user and cross-resource tests cannot read or mutate protected data.
- [ ] Production does not fall back to an open local-development mode.

## SEC-02 — API contracts and error behavior (P1)

### TODO
- [ ] Ensure all APIs use the `/api` prefix; fix NuxFarm bootstrap and all clients/smoke scripts together.
- [ ] Validate path, query and body inputs at API boundaries.
- [ ] Reject unexpected fields for mutation DTOs where appropriate.
- [ ] Use consistent error response shape and correct 4xx/5xx status codes.
- [ ] Add pagination with a capped page size for large list endpoints.
- [ ] Confirm CORS and health endpoints work at documented URLs.
- [ ] Add request IDs/correlation IDs where practical.
- [ ] Ensure error messages do not expose SQL, credentials, stack traces or sensitive data.

---

# 3. NuxWell

**MVP outcome:** a customer can discover a facility, check availability, create a booking, see it in their dashboard and cancel it where allowed.

## NW-01 — Facility and service discovery (P1)

### TODO
- [ ] Verify public facility listing supports pagination and search.
- [ ] Verify inactive facilities are excluded from public results.
- [ ] Implement/verify facility detail by stable slug.
- [ ] Display services associated with a facility, including duration, capacity and price where those fields exist.
- [ ] Validate that services belong to the selected facility.
- [ ] Add loading, empty, error and not-found states.
- [ ] Validate response payloads through the existing Zod web API client.
- [ ] Add API tests for search, pagination, inactive records and unknown slugs.
- [ ] Add Playwright tests for listing → detail navigation.

**Acceptance**
- [ ] Customer can discover a facility and inspect valid services.
- [ ] Inactive or mismatched facility/service combinations cannot be booked.

## NW-02 — Availability and booking lifecycle (P0)

### TODO: domain rules
- [ ] Define booking time semantics and timezone policy; store timestamps consistently and display in the facility's intended timezone.
- [ ] Validate `endsAt > startsAt`.
- [ ] Derive or validate duration against the selected service's `durationMinutes`.
- [ ] Require active facility and active service belonging to that facility.
- [ ] Derive the booking user from the authenticated session.
- [ ] Define what consumes capacity: all non-cancelled bookings in overlapping `[startsAt, endsAt)` intervals.
- [ ] Return clear availability results, but always re-check at booking creation time.
- [ ] Choose a concurrency-safe PostgreSQL strategy for capacity enforcement; a count-then-insert alone under ordinary read-committed isolation is not sufficient.
- [ ] Handle concurrent conflicts with a predictable `409 Conflict` or retry policy.
- [ ] Create booking endpoint with server-side validation and transactional persistence.
- [ ] List current user's bookings with pagination/status/time.
- [ ] Cancel booking only when owner/admin and status permits; cancellation must free capacity according to the defined rules.
- [ ] Prevent duplicate or invalid status transitions.
- [ ] Add admin booking list and filter if in the admin workflow.
- [ ] Add unit/API integration tests for invalid times, wrong service, inactive facility, conflict, capacity, cancellation ownership and repeated cancellation.
- [ ] Add parallel-request test proving capacity cannot be exceeded.
- [ ] Add Playwright journey: facility → service → availability → booking → dashboard → cancel.
- [ ] Update seed fixtures with predictable facilities/services/users and test data.

**Acceptance**
- [ ] No overbooking under simultaneous requests.
- [ ] Invalid bookings fail with correct 4xx responses.
- [ ] Only booking owner/admin can cancel.
- [ ] UI state reflects booking and cancellation results.

## NW-03 — Customer account and dashboard (P1)

### TODO
- [ ] Complete sign-in/sign-out and session state using the configured Neon Auth integration.
- [ ] Map verified auth subject to local `User` and handle first-login provisioning safely.
- [ ] Show upcoming and past bookings with statuses.
- [ ] Provide empty state for users with no bookings.
- [ ] Display actionable errors for expired sessions and failed API requests.
- [ ] Protect dashboard pages in the UI and enforce access again in the API.
- [ ] Test unauthenticated navigation and direct API calls.

## NW-04 — Admin facilities/services (P1)

### TODO
- [ ] Define admin role and bootstrap strategy.
- [ ] Add create/edit/deactivate facility and service operations only if not already present.
- [ ] Validate service duration, capacity, price and facility relationship.
- [ ] Prevent accidental deletion of records referenced by bookings; prefer deactivation/soft-delete where appropriate.
- [ ] Protect every admin mutation with API guards.
- [ ] Add tests for non-admin rejection and invalid values.
- [ ] Add UI loading, success, validation and failure feedback.

## NW-05 — NuxWell release checks (P1)

- [ ] Confirm health endpoint checks database connectivity.
- [ ] Verify all test entry points use `nuxwell_test`.
- [ ] Run API tests, web/API builds and Playwright journey in CI.
- [ ] Confirm production Neon Auth values are required and configured.
- [ ] Document environment variables and safe migration release step.

---

# 4. NuxFarm

**MVP outcome:** an authorized farm administrator can create a farm/location, set up a growing area and ginger crop cycle, plan tasks, log irrigation, import operational data and review overdue work.

## NF-01 — Farms, locations and growing areas (P1)

### TODO
- [ ] Verify create/list/detail/update flows for farms and locations.
- [ ] Enforce unique stable farm/location codes within the correct scope.
- [ ] Store the location timezone and use it consistently for task dates and reports.
- [ ] Support documented growing-area types such as field, greenhouse, hydroponics, nursery and storage.
- [ ] Validate area dimensions/units and prevent negative or impossible values.
- [ ] Scope every query to the user's authorized farms/locations.
- [ ] Add tests for duplicate codes, invalid areas and cross-farm access.
- [ ] Add UI empty/error/loading states and forms with validation.

## NF-02 — Crop cycles and stages (P1)

### TODO
- [ ] Create/update/list crop cycles with start date, expected end date and lifecycle status.
- [ ] Define allowed lifecycle transitions: planned → active → completed/abandoned, with validation.
- [ ] Create ordered cycle stages with unique sequence and status.
- [ ] Validate stage dates against cycle dates where applicable.
- [ ] Prevent duplicate active cycles only if the business rule explicitly requires it; document the scope of that rule.
- [ ] Provide crop-cycle detail page with stages, tasks and progress.
- [ ] Add tests for invalid dates, invalid transitions and cross-location access.
- [ ] Support historical cycle import without silently changing timestamps/timezones.

## NF-03 — Task templates, schedule and execution (P1)

### TODO
- [ ] Define task template fields, recurrence/offset rules and versioning.
- [ ] Generate tasks from cycle start/stage dates using an idempotent generation key.
- [ ] Prevent repeated generation from creating duplicate tasks.
- [ ] Support assignment, due date, priority and status.
- [ ] Validate allowed transitions among TODO, IN_PROGRESS, DONE, BLOCKED and SKIPPED.
- [ ] Record completion time, actor and notes for auditability.
- [ ] Add list filters by farm, cycle, status, assignee and due date.
- [ ] Surface overdue/upcoming work and timezone rules.
- [ ] Add tests for task generation, duplicate prevention, status transitions and unauthorized edits.

## NF-04 — Irrigation logs (P1)

### TODO
- [ ] Record event time, method, duration, volume, unit, growing area/cycle and observations where supported.
- [ ] Validate non-negative duration/volume and valid units.
- [ ] Require the user to be authorized for the relevant farm/location.
- [ ] Support list/filter by cycle and date range.
- [ ] Allow corrections with an audit trail rather than silently erasing operational history.
- [ ] Add tests for units, invalid quantities and access control.

## NF-05 — Inventory and material movements (P1)

### TODO
- [ ] Define material item names, category, units and optional reorder threshold.
- [ ] Record stock receipt, issue and adjustment as transactions.
- [ ] Calculate/reconcile balance from the movement ledger; do not allow untraceable edits to balances.
- [ ] Validate units and prevent invalid negative quantities unless an explicitly approved adjustment rule allows them.
- [ ] Add movement history and current balance views.
- [ ] Add tests for balance reconciliation, invalid quantities and concurrent movements.

## NF-06 — CSV/JSON import (P1)

### TODO
- [ ] Publish versioned import schemas and example files for farms/locations, cycles, tasks and irrigation records.
- [ ] Validate file type, size, row count and schema before processing.
- [ ] Implement dry-run/preview without database writes.
- [ ] Return row numbers, field names and actionable validation errors.
- [ ] Define all-or-nothing behavior for a file and enforce it in code.
- [ ] Support explicit external IDs/idempotency keys and reject or report duplicates.
- [ ] Validate referenced farm/location/cycle belongs to the caller's authorized scope.
- [ ] Normalize dates/timezones and report ambiguous or invalid timestamps.
- [ ] Record import summary and audit metadata.
- [ ] Commit only after user confirmation and a successful validation pass.
- [ ] Add tests for valid file, malformed JSON/CSV, missing columns, invalid enums/dates, duplicates, unauthorized references and rollback.
- [ ] Provide realistic demo fixtures that do not invent agronomic recommendations.

## NF-07 — Operational dashboard and reports (P1)

### TODO
- [ ] Show active crop cycles by farm/location.
- [ ] Show tasks due soon, overdue, blocked and completed.
- [ ] Show recent irrigation activity and inventory alerts.
- [ ] Provide date/farm/cycle filters.
- [ ] Define report calculations in one place and avoid inconsistent duplicate formulas.
- [ ] Test dashboard aggregates against seeded records and empty datasets.
- [ ] Add loading, error and empty states.

## NF-08 — Roles and agronomy safeguards (P0/P1)

### TODO
- [ ] Enforce platform-admin, farm-admin and member permissions at API level.
- [ ] Prevent users from reading or mutating other farms unless explicitly granted access.
- [ ] Keep sensitive admin actions auditable.
- [ ] Do not invent EC, pH, nutrient concentration, fertilizer quantities or crop-stage feeding schedules.
- [ ] If approved agronomy content is added later, store value, unit, growing system, crop stage, source, reviewer and effective date.
- [ ] Clearly distinguish measured observations from agronomist-approved target values.
- [ ] Add tests that unauthorized users cannot change configuration or import records.

## NF-09 — NuxFarm API, migration and test contract (P0)

### TODO
- [ ] Add the `/api` global prefix in `apps/api/src/main.ts`.
- [ ] Update web API client base paths, health scripts and smoke checks together.
- [ ] Review both existing init migrations; do not delete a migration that may have been applied.
- [ ] Test fresh database migration and existing dev database upgrade.
- [ ] Add Jest/API integration coverage; ensure test command cannot pass with zero tests unnoticed.
- [ ] Add fail-closed test database validation before migrations/cleanup.
- [ ] Complete NuxFarm README and environment examples.

---

# 5. NuxCafe

**MVP outcome:** a kitchen user can manage ingredients, recipes, menu items and orders; completion consumes stock once, records production/sales and keeps the ledger consistent.

## NC-01 — Ingredients and units (P1)

### TODO
- [ ] Define canonical units and conversion rules; do not silently compare incompatible units.
- [ ] Create/update/deactivate ingredients with cost, current stock and low-stock threshold.
- [ ] Validate quantities, costs and unit consistency.
- [ ] Record opening stock through an auditable stock movement.
- [ ] Protect mutations with role checks.
- [ ] Add tests for invalid units, negative values and duplicate identifiers.

## NC-02 — Recipes and recipe costing (P1)

### TODO
- [ ] Create recipe and recipe-item relationships.
- [ ] Validate ingredient references and positive quantities.
- [ ] Define conversions between recipe units and ingredient stock units.
- [ ] Calculate estimated recipe cost from current ingredient cost in a single shared service.
- [ ] Handle missing/inactive ingredients explicitly.
- [ ] Prevent accidental deletion of ingredients used by historical recipes.
- [ ] Add tests for cost calculations, unit conversions and missing ingredients.

## NC-03 — Menu items and pricing (P1)

### TODO
- [ ] Create/update menu items, category, price, prep time and availability.
- [ ] Validate price and preparation values.
- [ ] Recompute order totals server-side; never trust client-supplied totals.
- [ ] Define whether existing orders retain a price snapshot after menu prices change.
- [ ] Add tests for inactive items, price changes and invalid order lines.

## NC-04 — Orders and status transitions (P0)

### TODO
- [ ] Create orders with validated menu item IDs/slugs and quantities.
- [ ] Calculate totals from trusted current prices and store a price snapshot per order line if required for historical accuracy.
- [ ] Define allowed transitions among PENDING, PREPARING, READY, COMPLETED and CANCELLED.
- [ ] Reject invalid or repeated state transitions.
- [ ] Create production runs consistently with order lines.
- [ ] Enforce API authentication and kitchen/admin permissions.
- [ ] Add tests for invalid menu item, invalid quantity, status transition and unauthorized operation.

## NC-05 — Production tracking (P1)

### TODO
- [ ] Define production lifecycle and permitted transitions.
- [ ] Link production runs to order lines/batches.
- [ ] Prevent duplicate production completion.
- [ ] Record start/completion actor and timestamps where appropriate.
- [ ] Ensure cancellation rules agree with order state and stock consumption timing.
- [ ] Add tests for cancelled, completed and repeated transition attempts.

## NC-06 — Stock ledger and order completion (P0)

### TODO
- [ ] Keep stock movement history as the audit trail for receipts, adjustments and usage.
- [ ] Verify order completion checks required ingredients and quantities from recipes.
- [ ] In one transaction, decrement stock, write usage movements, complete eligible production runs/order and create one sale.
- [ ] Guarantee rollback if any write fails.
- [ ] Prevent concurrent orders from consuming the same stock beyond availability using appropriate transaction isolation/row locks/retry.
- [ ] Prevent duplicate completion and duplicate sale creation with state checks and idempotency where appropriate.
- [ ] Ensure cancellation before completion leaves stock untouched.
- [ ] Define an auditable reversal/refund process for post-completion corrections; do not silently erase sale/stock history.
- [ ] Add tests for insufficient stock, concurrent completions, repeated requests, transaction failure, cancellation and ledger reconciliation.
- [ ] Verify movement totals reconcile with on-hand stock after each scenario.

## NC-07 — Low-stock dashboard and sales reporting (P1)

### TODO
- [ ] Define low-stock comparison rule consistently (e.g. current balance at/below configured threshold).
- [ ] Surface low-stock warnings on dashboard and stock pages.
- [ ] Define sales summary by business date and timezone.
- [ ] Exclude cancelled orders appropriately from completed-sales totals.
- [ ] Reconcile dashboard totals with sale/order records.
- [ ] Add tests for threshold boundaries, empty data and date ranges.

## NC-08 — Roles and production readiness (P0)

### TODO
- [ ] Enforce kitchen/admin permissions in API guards/services.
- [ ] Protect ingredient cost, stock adjustment, menu administration and reports according to role policy.
- [ ] Ensure production auth configuration is mandatory and fails closed.
- [ ] Test direct API requests as anonymous, kitchen user and admin.
- [ ] Confirm `nuxcafe_test` is the only test database.
- [ ] Run current Jest and Playwright suites in CI; update README counts only from real output.

---

# 6. Cross-application release and operations

## REL-01 — Production environment and deployment (P0)

### TODO
- [ ] Define required env vars per web/API service and validate on startup.
- [ ] Confirm Render build/start commands for each of six services.
- [ ] Confirm Neon database and credentials are separate per app.
- [ ] Configure Neon Auth production values and same-origin auth proxy settings where used.
- [ ] Configure explicit CORS origins and correct API base URLs.
- [ ] Verify health endpoints and platform health-check paths.
- [ ] Run migrations as an explicit release step before activating the new API version.
- [ ] Document backward-compatible migration sequencing for deploys that overlap old/new application versions.
- [ ] Document backup/snapshot ownership, restore approval and data-loss implications.
- [ ] Smoke-test deployment without creating real customer bookings or consuming real inventory.
- [ ] Record release SHA, migration IDs, deployment time and smoke results.
- [ ] Rehearse application rollback and document when schema compatibility prevents a simple rollback.

## REL-02 — Observability and support (P1)

### TODO
- [ ] Log application errors and request IDs without secrets or unnecessary personal data.
- [ ] Make health endpoints distinguish process liveness from database readiness if useful.
- [ ] Document where to find Render logs and CI artifacts.
- [ ] Add runbooks for database connection failures, migration failures, auth misconfiguration and failed deployments.
- [ ] Add basic recovery instructions for NuxWell booking conflicts, NuxFarm import errors and NuxCafe stock reconciliation.

---

# 7. Deferred features (do not block MVP)

## NuxWell
- [ ] Online payments and refunds.
- [ ] Recurring family-group bookings and complex membership entitlements.
- [ ] Trainer scheduling, AI fitness testing and leaderboards.

## NuxFarm
- [ ] IoT sensor ingestion and automated control.
- [ ] Yield prediction and automatic agronomic recommendations.
- [ ] Nutrient recipe automation pending agronomist-approved research.
- [ ] Financial accounting and procurement automation.

## NuxCafe
- [ ] Online payments and delivery integration.
- [ ] Full accounting and advanced purchasing.
- [ ] Multi-branch/franchise management and demand forecasting.

## Platform
- [ ] Kubernetes, Redis, message broker and a cross-product admin portal.
- [ ] Complex observability platform before basic CI, logs and release runbooks are stable.

---

# 8. Pull request checklist

Copy this checklist into feature pull requests:

- [ ] Scope matches one backlog feature and existing code was inspected first.
- [ ] Schema and migration are included if data shape changes.
- [ ] Authorization and resource ownership are enforced server-side.
- [ ] Validation and useful error responses are present.
- [ ] Success, failure and concurrency tests are included where relevant.
- [ ] Test database safety guard runs before any migration or cleanup.
- [ ] No secrets or production data are included.
- [ ] Docs/examples/seed data are updated.
- [ ] CI is green on this exact commit.
- [ ] Rollback/migration implications are understood.
- [ ] No unrelated app or infrastructure dependency was added.
