# Deployment Design and Runbook

## Target hosting

| Platform | Role |
|---|---|
| GitHub | Source control, review and CI |
| Render | Three independently deployable web services and three API services |
| Neon PostgreSQL | Separate production database and credentials per application |
| Neon Auth | Production authentication |

Service map:

| App | Web service | API service | DB |
|---|---|---|---|
| NuxWell | `nuxwell-web` | `nuxwell-api` | dedicated NuxWell production DB |
| NuxFarm | `nuxfarm-web` | `nuxfarm-api` | dedicated NuxFarm production DB |
| NuxCafe | `nuxcafe-web` | `nuxcafe-api` | dedicated NuxCafe production DB |

Service names are proposed conventions, not a statement that these Render services already exist. Verify the actual dashboard settings before deployment.

## Environment separation

- **Local development:** Docker PostgreSQL; project-specific `*_dev` DB, local environment files and Mailpit.
- **CI/test:** disposable PostgreSQL service and project-specific `*_test` DB only.
- **Production:** Neon PostgreSQL and platform-injected variables. Never load `.env.local` or `.env.test` in production.
- Each application uses distinct production credentials and least-privilege access.
- Local and CI credentials must never point to production. Do not paste credentials into logs, source control or issue comments.

## CI requirements before production deployment

A GitHub Actions workflow should:

1. Trigger for relevant pull requests and pushes to the target branch.
2. Install from committed lockfiles using a deterministic install command.
3. Run Prisma schema validation and client generation for each application.
4. Provision disposable PostgreSQL and migrate only test databases.
5. Run each API's unit/integration tests and each web/API build.
6. Run Playwright smoke tests against locally started services when feasible, preserving traces/screenshots for failures.
7. Fail if test setup is given a database URL whose database name does not end in `_test`.
8. Publish a clear summary of commands and test results.

Never treat a workflow file's presence as proof that CI is green; inspect the run on the exact commit.

## Release procedure (per application)

1. **Review** — merge only after CI is green and code review covers authorization, migration compatibility and error handling.
2. **Prepare** — confirm Render build/start commands and required environment variables; confirm the target Neon database and backup/snapshot recovery path.
3. **Migrate** — execute the application's explicit `prisma migrate deploy` release command against the intended production database. Check logs and migration status before the new API version is enabled.
4. **Deploy** — deploy the affected API and web service. Do not run production migrations automatically during application startup.
5. **Smoke test** — check health endpoint under the documented `/api` prefix, key read path, and a safe test workflow that does not create real bookings or consume real inventory.
6. **Observe** — inspect Render logs and error rates; confirm no secrets or personal data leak into logs.
7. **Record** — record app, release commit SHA, migration identifier, deployment time, smoke results and operator.

Deploy each app independently. A change in one app should not require a release of the other two.

## Authentication and access control

- Require production Neon Auth configuration; fail closed if required variables are missing.
- Validate sessions at the API boundary and map identity to a local user record.
- Enforce roles, resource ownership and farm/location boundaries in API guards/services.
- Use explicit CORS origin allowlists and secure cookie/session settings.
- Test unauthorized and cross-resource requests before release.
- Avoid logging authorization headers, cookies, passwords, raw tokens or secrets.

## Rollback and recovery

1. **Application rollback:** redeploy the previous Render service version only if its schema remains compatible.
2. **Schema issue:** Prisma migrations are forward-only by default. Prefer a new corrective migration. Never delete/edit an applied migration to simulate rollback.
3. **Data issue:** stop unsafe writes, assess audit records, and use an approved restore/correction procedure. A point-in-time restore can discard newer writes; agree on the restore point and data-loss impact before executing.
4. **Cafe stock/order issue:** preserve stock movement history and reconcile balances; avoid manually changing stored quantities without an auditable adjustment.
5. **Farm import issue:** use import metadata and idempotency keys to identify affected rows before a controlled correction.
6. Record incident timeline, affected commit, migration, recovery actions and validation after restoration.

## Release checklist

- [ ] CI green on the exact commit being released.
- [ ] Fresh test database successfully migrates using deploy-mode migrations.
- [ ] Target production database and credentials verified for the correct app.
- [ ] Backup/snapshot and recovery owner/time window confirmed.
- [ ] All required production auth values present; open local-dev auth mode impossible in production.
- [ ] CORS, API base URLs and health checks match the service configuration.
- [ ] Migration executed as a separate release step and verified.
- [ ] Web/API deploy succeeds and smoke checks pass without affecting real records.
- [ ] Rollback route is understood and schema compatibility checked.
- [ ] Commit SHA, migration, smoke results and deployment timestamp recorded.
