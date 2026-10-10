# NuxFarm — MVP Scope

Multi-location farms, crop cycles, operational tasks and irrigation
records, with a practical ginger-farm workflow.

## First complete farm workflow

1. Create a farm location
2. Define a field or hydroponic growing area
3. Create a ginger crop cycle
4. Generate or import operational tasks
5. Record irrigation and completed tasks
6. Review progress and overdue tasks

## Included in the MVP

- Multi-location farm administration (farms with codes, timezones,
  addresses).
- Farm layouts and growing areas (field, greenhouse, high tunnel,
  shade house, nursery, storage) with area and codes.
- Crop cycle creation with start/expected end dates and lifecycle
  status (`PLANNED | ACTIVE | COMPLETED | ABANDONED`), plus cycle
  stages with sequence and status.
- Task templates, planned dates, assignments and completion logs
  (`TODO | IN_PROGRESS | DONE | BLOCKED | SKIPPED`, priorities).
- Irrigation event records (method, duration, volume, observations).
- Basic inventory records for agricultural materials with
  transactional stock movements (`IN | OUT | ADJUST`) and
  `balanceAfter` audit trail.
- CSV/JSON import with validation, preview and per-row error
  reporting (dry-run before commit).
- Dashboard for active crop cycles, upcoming tasks and overdue tasks.
- Reports: operations overview, crop cycle summary, task summary,
  irrigation summary, inventory summary.
- Role-based access separating platform administration from farm
  administration (`OWNER | ADMIN | MEMBER`).

## Deferred

Automatic agronomic recommendations, advanced IoT, predictive yield
analytics, financial accounting, automatic nutrient recipes.

## Ginger / hydroponic data rule

Do **not** invent EC, pH, nutrient concentration or fertilizer
schedules. Until agronomist-approved data is available, the
application only lets authorized users record observations and
configure verified values. The schema deliberately stores no
agronomic chemical values (this is already enforced in the current
implementation and must be preserved).

## Current state (see audit.md)

The full domain schema, API modules (farms, cycles, tasks, irrigation,
inventory, reports, users) and web pages already exist and work.
Missing for the MVP: CSV/JSON import, role-based access control,
a dashboard overview page, Jest tests with a test-database safety
contract, a project README, and the `/api` global prefix used by the
other two applications.

## Acceptance criteria

- The farm admin can manage an active crop cycle end to end without
  manually editing the database.
- CSV/JSON import validates every row, shows a preview, reports
  per-row errors, and commits nothing when validation fails.
- Overdue and upcoming tasks are surfaced on the dashboard.
- A `MEMBER` cannot perform platform- or farm-admin actions.
