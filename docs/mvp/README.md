# Nux Dev Platform — MVP Programme

Coordinated MVP plan for the shared development platform and three independently deployable business applications: **Nux Dev Infrastructure**, **NuxWell**, **NuxFarm** and **NuxCafe**.

The repository already contains substantial application code. This programme is therefore an implementation-aware stabilization and completion plan—not a greenfield rewrite. Preserve useful modules, test claims with executable evidence, and make changes in dependency order.

## Current programme status

| Workstream | Baseline status | Next gate |
|---|---|---|
| Shared infrastructure | Compose and PowerShell operations scripts present | Clean checkout; env and reset safety checks; repeatable migrations/seeds |
| NuxWell | Facilities, user/facility/service/booking models and UI baseline present | Complete booking availability/create/history/cancel with concurrency-safe capacity enforcement |
| NuxFarm | Farm/cycle/task/irrigation/inventory/report modules and UI pages present | Standardize API prefix; complete imports, operational dashboard, authorization and test contract |
| NuxCafe | Menu/recipe/stock/order/production/sales vertical slice present | API authorization and stock/order concurrency and failure-path proof |
| CI/release | No GitHub Actions workflow was found in the audited branch | Green clean-install build/test pipeline and release runbooks |

See [audit.md](audit.md) for detailed source findings. Test counts mentioned in READMEs or commit messages are historical reports until re-run in CI.

## Read the plan in order

1. [architecture.md](architecture.md) — stack, database isolation, ports and API conventions.
2. [audit.md](audit.md) — source-level baseline and prioritized blockers.
3. [feature-breakdown.md](feature-breakdown.md) — detailed feature-by-feature TODOs, priorities, dependencies and acceptance checks.
3. [milestones.md](milestones.md) — dependency-ordered work and objective phase exit gates.
4. [scope-nuxwell.md](scope-nuxwell.md) — booking workflow and integrity rules.
5. [scope-nuxfarm.md](scope-nuxfarm.md) — crop-cycle workflow, imports and agronomy safeguards.
6. [scope-nuxcafe.md](scope-nuxcafe.md) — order, production and stock integrity.
7. [acceptance-criteria.md](acceptance-criteria.md) — definition of done and required tests.
8. [deployment.md](deployment.md) — Render/Neon release, migration and rollback procedure.

## Initial backlog

| Epic | Priority | Focus |
|---|---|---|
| INF-1 | P0 | Infrastructure hardening and repeatable setup |
| INF-2 | P0 | Environment, migration, reset and test database safety |
| INF-3 | P0 | GitHub Actions clean-install/build/test pipeline |
| REL-1 | P0 | API security, production auth, smoke test and release safety |
| NW-2 | P0 | Transaction-safe availability and booking integrity |
| NW-1 / NW-3 | P1 | Facility detail, customer dashboard and admin workflow |
| NF-1 / NF-2 | P1 | Farm cycles, tasks, irrigation, import and overview |
| NC-2 | P0 | Order/stock concurrency and failure-path verification |
| NC-1 | P1 | Ingredient, recipe and menu completeness |

## Non-negotiable engineering rules

- **No Redis** or new infrastructure service during the MVP.
- Share patterns and infrastructure only; keep per-app business schemas, migrations, credentials and databases separate.
- Automated tests, destructive setup and test cleanup must refuse database URLs not ending in `_test`.
- UI visibility is not authorization. Protect sensitive APIs and resource ownership server-side; production must fail closed if auth is absent.
- Booking and stock invariants must hold under concurrent requests, not merely sequential happy-path tests.
- Do not reset production data or rewrite migration history casually.
- Do not manufacture ginger hydroponic EC/pH/nutrient targets. Use agronomist-approved values with units, stages, source and effective dates.
- A task is complete only when executable test results are recorded against the commit being reviewed.
