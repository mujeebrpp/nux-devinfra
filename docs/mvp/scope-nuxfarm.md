# NuxFarm — MVP Scope

Multi-location farm operations for field and soilless growing systems, with a practical crop-cycle workflow. This scope completes and hardens the current implementation rather than replacing it.

## Primary workflow

1. Platform admin creates a farm/location and assigns farm administrators.
2. Farm admin configures a growing area (field, greenhouse, hydroponics or another supported area type).
3. Farm admin creates a crop cycle with dates and stages.
4. Tasks are planned from templates or imported from a validated CSV/JSON file.
5. Operators record task progress, irrigation events and inventory movements.
6. Dashboard summarizes active crop cycles, upcoming/overdue work, irrigation and inventory.
7. Reports support review of cycle and task progress.

## MVP scope

- Multi-location farms and locations with codes, addresses and timezone.
- Growing areas and crop cycles with stages, dates and lifecycle status.
- Task templates, schedule, priority, assignment, status and completion history.
- Irrigation records: date/time, method, duration, volume and notes.
- Agricultural material inventory with auditable `IN`, `OUT` and `ADJUST` movements.
- CSV/JSON import: validate → preview/dry-run → show row errors → explicit commit.
- Overview dashboard with active cycles, upcoming tasks and overdue tasks.
- Farm operations, crop-cycle, tasks, irrigation and inventory reports.
- API-side role and resource checks for platform admins, farm admins and members.

## Import behavior

- Validate schema, required fields, field lengths, enums, numeric ranges and date/time formats before writing.
- Return a preview summary and row-specific errors; make no writes when required validation fails.
- Use explicit external IDs or idempotency keys to avoid duplicate historical imports.
- Never let client-provided farm/location identifiers bypass the caller's permissions.
- Record import metadata (source name, user, timestamp, counts and validation outcome) without logging secrets or unnecessarily retaining uploaded sensitive content.
- Apply valid rows in an explicit transaction or documented bounded batches, with a clear all-or-nothing policy for each import operation.

## Hydroponic ginger data safeguard

The app may store readings and agronomist-approved targets, but it must **not invent** EC, pH, nutrient concentration, fertilizer quantities or crop-stage feeding schedules. Production recommendations require a qualified agronomist's review and should store units, crop stage, growing system, source/reference, reviewer and effective date. Until that content is approved, support recording observations and label target values as unavailable rather than presenting made-up defaults.

## Current baseline and remaining work

The current branch contains farm/cycle/task/irrigation/inventory/report API modules, Prisma domain models, seed data, a Next.js UI and smoke scripts. The source review identified these remaining tasks; verify them as commits land:

- [ ] Add `/api` global prefix and update all API clients and smoke scripts together.
- [ ] Add validated CSV/JSON import with preview and row errors.
- [ ] Add overview dashboard for active cycles and upcoming/overdue tasks.
- [ ] Enforce API authentication, roles and farm/location resource scope.
- [ ] Provide Jest/API tests and a fail-closed `nuxfarm_test` database contract.
- [ ] Complete project setup, test, migration and reset documentation.
- [ ] Review the two existing init migrations without deleting applied history; test fresh and already-initialized databases.
- [ ] Use idempotent import and task generation to prevent duplicate tasks.

## Acceptance criteria

- Farm administrator can complete the primary workflow without editing the database manually.
- A normal member cannot perform platform/farm-admin operations or access a different farm outside their scope.
- Valid imports preview and commit; invalid imports report row-level issues and commit nothing.
- Duplicate import retries do not duplicate cycles/tasks/inventory movements.
- All API routes use the documented `/api` prefix and are covered by tests.
- Automated tests refuse any effective database URL not ending in `_test`.
