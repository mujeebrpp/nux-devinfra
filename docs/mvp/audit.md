# Repository Audit (Phase 0 baseline)

Audit of the `projects/nuxwell-init` baseline, captured
2026-10-10. This document is the Phase 0 work list.

## What already works (retain, do not rewrite)

### Infrastructure (repository root)

- `docker-compose.yml`: PostgreSQL 17 + pgAdmin + Mailpit with
  healthchecks, persistent volumes and configurable ports.
- `postgres/init/01-databases.sql`: creates all six databases
  (`nuxwell_dev/test`, `nuxfarm_dev/test`, `nuxcafe_dev/test`).
- `scripts/{up,down,status,reset}.ps1`; `reset.ps1` requires
  typing `RESET` before destroying the volume.
- `.gitignore` excludes `.env*`, `node_modules/`, `dist/`, logs
  and generated artifacts.

### NuxWell

- Schema: `User` (with `authSubjectId` for Neon Auth), `Facility`,
  `Service`, `MembershipPlan`, `Booking`.
- API: facilities list (pagination, search, active filter) and
  detail by slug; database-backed health endpoint.
- Seed: idempotent; admin + demo accounts, 3 facilities, 6
  services, 3 membership plans, 2 sample bookings.
- Web: homepage, login/register, dashboard (facility overview),
  Neon Auth proxy with optional open local-dev mode.
- Tests: Jest + Playwright with a test-database safety contract
  (`apps/api/test/global-setup.js` refuses non-`_test` databases).
  README reports 9/9 Jest and 9/9 Playwright.
- Web API client validates every response with Zod.

### NuxFarm

- Schema: `Farm`, `FarmLocation`, `CropCycle`, `CycleStage`,
  `Task`, `IrrigationLog`, `InventoryItem`, `InventoryTransaction`,
  `Report`, `User`.
- API modules: farms, cycles, tasks, irrigation, inventory,
  reports, users, health — with a shared Zod validation pipe,
  exception filter and response interceptor.
- Web: farms list, farm detail, cycles, cycle detail, tasks,
  irrigation, inventory, reports pages.
- Seed: idempotent. Playwright smoke tests.
- Stores no EC/pH/nutrient values (matches the ginger data rule).

### NuxCafe (most complete)

- Schema: `Ingredient`, `MenuItem`, `Recipe`, `RecipeItem`,
  `StockMovement`, `Production`, `Order`, `OrderItem`, `Sale`.
- API: ingredients, menu-items, recipes, stock, production,
  orders, sales, dashboard, health.
- Order completion is transactional: pre-flight stock check, then
  one transaction that decrements stock, writes `USAGE` movements,
  completes production runs, completes the order and creates the
  `Sale`. Cancellation cancels production runs without consuming
  stock.
- Web: full dashboard (ingredients, kitchen, menu, orders,
  recipes, sales, stock) with Neon Auth hooks.
- Tests: Jest 9 suites / 46 tests + Playwright 13 smoke tests,
  test-database safety contract. Comprehensive README.

## Gaps against the MVP plan

| # | Gap | Blocks |
|---|-----|--------|
| 1 | No CI — no `.github/workflows` anywhere | INF-3, REL-1 |
| 2 | No `docs/mvp/` programme documentation | (created in this session) |
| 3 | NuxWell booking workflow missing entirely: no bookings API module, no availability lookup, no overlap/capacity enforcement, no cancellation; web dashboard shows facilities only | NW-2 (critical path) |
| 4 | No API-level auth/authorization in any app — APIs are fully open; no guards or role enforcement | NW-3, NF RBAC, NC roles, REL-1 |
| 5 | NuxFarm: no CSV/JSON import with validation, preview and error reporting | NF requirement |
| 6 | NuxFarm: no README, no Jest tests (`jest --passWithNoTests`), no test-DB safety contract, no dashboard page for active/upcoming/overdue tasks | DoD, NF dashboard |
| 7 | Inconsistencies (see below) | Phase 0 |
| 8 | `reset.ps1` does not re-migrate/re-seed after a volume reset; no migrate/seed orchestration across the three dev databases | INF-1/2 |
| 9 | No deployment runbooks; migration deploy is not yet a defined release step | REL-1 |

## Inconsistencies to fix in Phase 0

1. **`scripts/status.ps1` hardcodes port 5432** while the machine
   `.env` uses `POSTGRES_PORT=5433`. Read the port from `.env`.
2. **NuxFarm API has no `/api` global prefix** (`main.ts` sets no
   global prefix; controllers are `@Controller("farms")` etc.),
   while NuxWell and NuxCafe use `app.setGlobalPrefix("api")`.
   NuxFarm's `health-check.ps1` also references a stale API on
   port 3094 (NuxCafe's web port). Standardize on `/api` and fix
   the smoke scripts.
3. **NuxFarm has two init migrations**: `20261007014658_init`
   created a stray `HealthCheck` table; `20261009084321_init`
   dropped it and created the real schema. Consolidate or document.
4. **Mixed validation styles**: class-validator DTOs in NuxWell
   and NuxCafe vs Zod pipes in NuxFarm. Both are permitted by the
   standards; keep each app's existing style and do not rewrite
   working validation (revisit only when touching a module anyway).
5. **NuxFarm test script** (`jest --passWithNoTests`) has no
   global setup and therefore no test-database safety contract.

## Notes

- The uncommitted `projects/nuxwell/README.md` change on the
  baseline only corrects the Node.js LTS version (22 → 24).
- Per-project GitHub repositories have not been created yet; all
  three projects currently live in this repository.
