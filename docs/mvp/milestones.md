# MVP Delivery Milestones

This is a dependency-ordered delivery plan for one primary developer using coding assistance. Week ranges are estimates, not commitments; exit gates and test evidence determine completion.

## Phase 0 — Establish a safe, repeatable baseline

**Goal:** a clean checkout can start the infrastructure, run each app independently, and test without touching development or production data.

### Work items

1. **Infrastructure and environment contract**
   - Fix `scripts/status.ps1` so the host-side PostgreSQL port comes from `.env`; container-internal connections continue to use port 5432.
   - Check required variables at startup and document which files each app uses in development, test and production. Do not load local environment files in production.
   - Validate the Docker Compose file and confirm the six expected databases are created on a fresh volume.
   - Keep destructive reset explicit and confirmation-protected. Add migrate/seed orchestration without making ordinary startup destructive.

2. **Test isolation and CI**
   - Add a common test-safety contract to every Jest, Playwright, migration, seed and reset entry point. Refuse to run any destructive test setup unless the selected database name ends in `_test`.
   - Add GitHub Actions to install dependencies from lockfiles, validate/generate Prisma clients, start a disposable PostgreSQL service, migrate clean test databases, run unit/API tests, build all web/API apps and run Playwright smoke tests.
   - Verify that every app's test command actually discovers tests; do not use `--passWithNoTests` as a substitute for coverage.
   - Publish logs and screenshots/traces as workflow artifacts for failed E2E checks where practical.

3. **API/runtime conventions**
   - Add the `/api` global prefix to NuxFarm and update health/domain scripts and web clients in the same change.
   - Review the two NuxFarm init migrations. Preserve migration history; prove a clean database deploy and document how an existing developer database advances.
   - Add a project README for NuxFarm if it is still missing after implementation.
   - Confirm all applications use the documented ports: NuxWell web/API 3090/3091, NuxFarm 3092/3093, NuxCafe 3094/3095.

4. **Authentication/security baseline**
   - Inventory API controllers and mark endpoints public, authenticated-user, resource-owner or admin-only.
   - Enforce auth and role checks on the API, not only in the UI. Production must fail closed when auth configuration is absent or invalid.
   - Define CORS allowlists, cookie/session handling and safe error responses from environment variables.

**Exit gate:** a clean checkout can install, start the database, migrate and seed dev databases, build all six application surfaces, and run CI against isolated test databases. Negative safety tests prove that test setup refuses a non-`_test` URL. No production claim is made until auth/config tests pass.

## Phase 1 — Complete the NuxWell booking vertical slice

**Goal:** a customer can discover a facility and complete a safe booking lifecycle.

### Work items

- Add availability lookup, booking create, customer history and cancellation APIs.
- Validate facility/service status, duration, time ranges, ownership and cancellable states.
- Enforce capacity/overlap in a transaction with an appropriate concurrency strategy. A UI-only availability check is insufficient.
- Connect Neon Auth session identity to the local `User` using `authSubjectId`; enforce API guards for customer and admin operations.
- Build facility/service details → availability → booking → dashboard/history → cancellation; include loading, empty, validation and error states.
- Add seed fixtures and API/E2E tests, including parallel requests, duplicate/overlapping booking, invalid service, unauthorized access and cancellation ownership.

**Exit gate:** Playwright completes a booking against `nuxwell_test`; API tests demonstrate no capacity oversell under concurrency and all protected endpoints enforce ownership/roles.

## Phase 2 — Complete the NuxFarm operations vertical slice

**Goal:** a farm administrator can manage an active crop cycle through the UI without editing database rows manually.

### Work items

- Complete farm/location and crop-cycle creation/editing; keep existing domain modules unless a concrete defect requires change.
- Finish task lifecycle: plan/assign/start/complete/block/skip and make upcoming/overdue tasks visible on an operational overview.
- Add CSV/JSON import with schema validation, dry-run preview, row-level error reporting and explicit commit. A file with validation errors must not partially commit.
- Add platform-admin/farm-admin/member authorization and resource-scope checks.
- Add Jest/API integration tests and a test-DB safety contract; add import fixtures and document setup.
- Support historical imports and future task projections only through explicit schemas; surface invalid dates, duplicate external IDs and timezone assumptions.

**Agronomy safeguard:** do not introduce generated EC, pH, nutrient concentrations or fertilizer schedules as authoritative values. Keep recommendations deferred until a qualified agronomist supplies reviewed values, units, crop stages, source and effective dates.

**Exit gate:** farm admin manages a cycle, records irrigation and completes tasks; overview shows active/upcoming/overdue work; valid imports commit and invalid imports commit nothing; a member cannot perform admin operations.

## Phase 3 — Harden and complete the NuxCafe kitchen vertical slice

**Goal:** the order-to-production-to-stock workflow remains consistent under failure and concurrent activity.

### Work items

- Enforce authentication and kitchen/admin role permissions on API endpoints.
- Confirm order totals are calculated server-side from current prices.
- Preserve transactional order completion and auditable stock movements.
- Test insufficient stock, cancellation before completion, transaction rollback, duplicate completion and two orders competing for the same ingredient stock.
- Confirm low-stock indicators and daily order/sales totals against source records.
- Document stock adjustment semantics and ensure adjustments always create traceable movements.

**Exit gate:** order completion updates order, production, sale and stock exactly once; failure or cancellation leaves stock correct; concurrent completion cannot create duplicate consumption.

## Phase 4 — Release readiness and independent deployment

**Goal:** all three apps can be deployed and rolled back independently.

### Work items

- Run the full acceptance suite from a clean environment and record commit SHA, commands, outcomes and artifacts.
- Verify Render web/API build commands, health checks, environment variables and CORS for all three pairs.
- Configure separate Neon database credentials per application/environment; verify Neon Auth production configuration.
- Run `prisma migrate deploy` as an explicit release step before switching the API to the new release. Never reset a production database.
- Verify backups/snapshots and a rollback exercise with a schema-compatible previous application version.
- Run smoke tests against deployed web and API URLs without exposing secrets or production customer data.
- Complete operational documentation: first install, startup/shutdown, safe reset, migrations, seeds, test commands, backup/restore, incident notes and deployment rollback.

**Exit gate:** CI is green, each app passes acceptance and deployed smoke tests, each app can release independently, and rollback instructions have been rehearsed.

## Backlog mapping

| Epic | Phase | Priority |
|---|---:|---|
| INF-1 Infrastructure hardening | 0 | P0 |
| INF-2 Environment and database safety | 0 | P0 |
| INF-3 CI build and test pipeline | 0 | P0 |
| REL-1 Security, smoke tests and release | 0 and 4 | P0 |
| NW-1 Facilities and services | 1 | P1 |
| NW-2 Availability and booking integrity | 1 | P0 |
| NW-3 Customer dashboard and admin | 1 | P1 |
| NF-1 Farm locations and crop cycles | 2 | P1 |
| NF-2 Tasks, irrigation and import | 2 | P1 |
| NC-1 Ingredients, recipes and menu | Existing baseline; harden in 3 | P1 |
| NC-2 Orders, production and stock | Existing baseline; harden in 3 | P0 |

## Working rule

Do not start the next feature because a calendar week elapsed. Start it when the previous phase's exit evidence is recorded. Keep commits small, preserve working modules and migration history, and never make a deployment or destructive reset part of a documentation-only change.
