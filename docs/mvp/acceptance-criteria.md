# Acceptance Criteria

## Definition of Done (applies to every MVP feature)

- [ ] User can complete the workflow in the UI.
- [ ] API validates inputs and enforces permissions.
- [ ] Database changes are represented by a committed Prisma migration.
- [ ] Seed data is repeatable and safe to run (idempotent).
- [ ] Automated tests cover success and important failure cases.
- [ ] Loading, empty, validation and error states are present.
- [ ] The feature works from documented local setup instructions.
- [ ] No secrets, real user data or production URLs are hard-coded.
- [ ] CI passes before merging.
- [ ] Deployment and rollback implications are documented.

## Test isolation rules (hard safety controls)

1. Automated tests **never** use a development or production
   database. Jest global setup must refuse to run unless
   `DATABASE_URL` points at a database whose name ends in `_test`
   (pattern already implemented in NuxWell and NuxCafe; NuxFarm
   adopts it in Phase 0/2).
2. CI provisions a dedicated PostgreSQL service and points every
   test run at its `*_test` database.
3. E2E fixtures use isolated slugs/emails and clean up in
   `afterAll`.
4. `docker compose down -v` and `scripts/reset.ps1` are the only
   sanctioned ways to destroy local data, and reset requires
   explicit confirmation.

## Per-application acceptance tests

### NuxWell (Phase 1)

- Customer journey: list → detail → availability → book → dashboard
  (Playwright, against `nuxwell_test`).
- Two parallel booking requests that together exceed facility
  capacity: exactly one succeeds.
- Overlapping window, mismatched duration, unknown facility/service:
  standard 4xx responses.
- Unauthenticated create/cancel is rejected; non-admin facility
  management is rejected.

### NuxFarm (Phase 2)

- Farm admin journey: create farm → add growing area → create ginger
  crop cycle → generate/import tasks → log irrigation → dashboard
  shows active cycle and overdue tasks.
- CSV/JSON import: valid file previews and commits; invalid file
  reports per-row errors and commits nothing.
- `MEMBER` role cannot perform platform- or farm-admin actions.

### NuxCafe (Phase 3)

- Kitchen journey: ingredient → recipe → menu item → order →
  production → completion → stock balance reconciles.
- Order completion with insufficient stock fails cleanly and changes
  nothing.
- Cancelling an active order leaves stock untouched.
- Low-stock ingredient surfaces a warning on the dashboard.
- Kitchen role cannot access admin actions.

## Infrastructure acceptance (Phase 0)

A new checkout can:
1. Start the shared database (`scripts/up.ps1`).
2. Migrate and seed all three development databases
   (`scripts/migrate-all.ps1`, `scripts/seed-all.ps1`).
3. Run each application independently (each web/API pair starts
   without the other two).
4. Execute tests without changing development data.
