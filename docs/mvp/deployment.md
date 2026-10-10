# Deployment Design

## Platforms

| Platform | Role |
|---|---|
| GitHub | Source control, pull requests, CI |
| Render | 3 web services + 3 API services |
| Neon | Separate per-application databases and access credentials |
| Neon Auth | Production authentication |

## Service map

| Application | Render web service | Render API service | Neon database |
|---|---|---|---|
| NuxWell | `nuxwell-web` (:3090 equivalent) | `nuxwell-api` | `nuxwell` (production) |
| NuxFarm | `nuxfarm-web` | `nuxfarm-api` | `nuxfarm` (production) |
| NuxCafe | `nuxcafe-web` | `nuxcafe-api` | `nuxcafe` (production) |

Each web/API pair deploys independently. A change to one application
never requires deploying the others.

## Environment separation

- **Local development:** Docker PostgreSQL (`nux-dev-postgres`),
  per-app `*_dev` databases, optional open auth mode, Mailpit for
  email.
- **CI/test:** dedicated PostgreSQL service, per-app `*_test`
  databases only.
- **Production:** Neon PostgreSQL, per-app database and credentials,
  real environment variables injected by Render (no env files are
  read in production), Neon Auth enforced.

Local development never connects to a Neon database, and production
never connects to the local Docker container.

## Database migrations

Migrations are an **explicit release step**, not an uncontrolled
action on application startup:

1. Developer commits schema change + `prisma migrate dev` migration
   files.
2. CI runs `prisma migrate deploy` against the `*_test` database to
   verify the migration applies cleanly.
3. On release, the deploy pipeline (or operator) runs
   `prisma migrate deploy` against the production Neon database
   before the new API service goes live.
4. Applications start with the deployed schema; startup does not
   auto-migrate.

Keep test, staging and production database URLs separate. Never run
`prisma migrate reset` against a shared database.

## Authentication in production

- Neon Auth (Managed Better Auth) is **required** in production:
  the web app proxies auth traffic through its same-origin
  `/api/auth/[...path]` route so session cookies are set on the
  app's own domain.
- The API validates the session and maps the Neon Auth subject to
  the local `User` via `authSubjectId`; role guards enforce
  authorization per application.
- "Open local development mode" (when `NEON_AUTH_BASE_URL` /
  `NEON_AUTH_COOKIE_SECRET` are unset) must never be reachable in
  production: production always supplies real values.

## Rollback runbook

1. **Web/API rollback:** redeploy the previous Render service
   snapshot. Next.js and NestJS deploys are stateless; rolling back
   the service is safe as long as the database schema is compatible.
2. **Migration rollback:** Prisma migrations are forward-only.
   For a schema regression, write a new corrective migration rather
   than reverting; if the corrective migration is non-trivial,
   restore the Neon database from a snapshot (Neon supports
   point-in-time restore) and redeploy the previous service version.
3. **Data-only issues:** use the application's own adjustment
   endpoints (e.g. NuxCafe stock adjustments, NuxFarm inventory
   transactions) so every change stays in the audit trail.

## Release checklist

- [ ] CI green on the merge commit.
- [ ] `prisma migrate deploy` verified against a fresh `*_test`
      database in CI.
- [ ] Production Neon database credentials rotated/verified per app.
- [ ] Neon Auth production values configured for the web service.
- [ ] Render environment variables match `.env.*.example` contracts.
- [ ] Smoke tests pass against the deployed web and API services.
- [ ] Rollback path confirmed before the release is announced.
