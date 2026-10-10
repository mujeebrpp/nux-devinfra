# Acceptance Criteria

## Definition of Done

A feature or phase is complete only when:

- [ ] A user can complete the workflow through the UI.
- [ ] API inputs are validated and auth/role/ownership rules are enforced server-side.
- [ ] Database changes have a committed Prisma migration.
- [ ] Seeds are repeatable and safe to run.
- [ ] Automated tests cover success, validation, permission and important failure/concurrency cases.
- [ ] UI loading, empty, validation, success and error states are present where applicable.
- [ ] The workflow is documented and works from a clean checkout.
- [ ] No secrets or real user data are committed.
- [ ] CI is green on the exact commit under review.
- [ ] Deployment, migration compatibility and rollback implications are documented.
- [ ] Evidence includes commit SHA, commands and test output/artifacts; a README assertion alone is not test evidence.

## Database safety contract — mandatory

1. Test commands and setup scripts must fail before any migration, cleanup or write if the effective database name does not end in `_test`.
2. CI uses disposable PostgreSQL and isolated test databases. Never connect CI tests to development or production databases.
3. A guard must exist in each independent test entry point: Jest setup, Playwright setup, helper scripts and CI migration steps. Do not rely on only one layer.
4. Test and seed URLs must not be silently replaced by `.env.local` when `NODE_ENV=test`.
5. Reset commands must print the affected volume/database and require explicit confirmation. Routine startup must never reset data.
6. The shared PostgreSQL host port can vary (5432 or developer override 5433); the in-container port stays 5432.

## Security acceptance

- [ ] Every API controller/route is classified as public, authenticated, resource-owner or admin-only.
- [ ] Unauthenticated write requests are rejected.
- [ ] Users cannot read or change another user's resources without explicit authorization.
- [ ] Member/farm/kitchen roles cannot call admin-only operations.
- [ ] Production refuses to start or serve protected routes when required auth configuration is missing.
- [ ] CORS is restricted to explicit trusted origins.
- [ ] Secrets and session tokens never appear in logs or client bundles.

## NuxWell — booking workflow

- [ ] Customer journey: listing → detail → availability → create booking → dashboard/history → cancel where allowed (Playwright on `nuxwell_test`).
- [ ] Service belongs to the selected active facility; time window is valid and duration matches the service.
- [ ] Two concurrent booking requests that together exceed facility capacity cannot both succeed.
- [ ] Overlapping windows and capacity errors return a predictable 4xx response.
- [ ] Only the booking owner or an authorized admin can cancel; terminal/cancelled bookings cannot be cancelled again.
- [ ] Unauthenticated booking writes and non-admin facility/service mutations are rejected.
- [ ] Test fixtures use deterministic, isolated identifiers and leave the test database in a repeatable state.

## NuxFarm — farm operations

- [ ] Farm admin can create/manage a location, growing area and crop cycle, record tasks and irrigation, and inspect summary status without editing the database manually.
- [ ] Upcoming and overdue tasks appear in the operations overview.
- [ ] Valid CSV/JSON import previews and commits; invalid rows are reported; validation failure commits nothing.
- [ ] Import handles duplicate identifiers, missing required fields, malformed dates and timezone assumptions explicitly.
- [ ] Role/resource-scope checks block unauthorized farm/location access.
- [ ] API routes use the documented `/api` prefix and smoke tests exercise the same URLs.
- [ ] Automated tests refuse to use a non-`_test` database.

## NuxCafe — kitchen and stock

- [ ] Kitchen journey: ingredient → recipe → menu item → order → production → completion → reconciled stock.
- [ ] Server recomputes order totals from current price data.
- [ ] Insufficient stock fails cleanly and changes nothing.
- [ ] Cancelling an incomplete order does not consume stock.
- [ ] Duplicate/concurrent completion cannot double-consume stock or create duplicate sales.
- [ ] Stock movements explain each stock balance change and reconcile with on-hand quantity.
- [ ] Low-stock status is visible and has boundary tests.
- [ ] Non-admin roles cannot invoke admin operations.

## Infrastructure and release

- [ ] Clean checkout starts PostgreSQL, pgAdmin and Mailpit.
- [ ] All six databases are present after fresh volume initialization.
- [ ] All six app ports are documented and independently startable.
- [ ] CI performs clean install, Prisma validation/generation, migrations into disposable test DBs, builds, unit/API tests and Playwright smoke checks.
- [ ] Production migration is a separate release step, never automatic on API startup.
- [ ] Release checklist and rollback procedure are followed for each app independently.
