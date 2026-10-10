# NuxWell

Local development environment for the NuxWell wellness platform: a
NestJS API, a Next.js web app, and Playwright end-to-end tests, all
running against a local PostgreSQL container.

## Layout

```
projects/nuxwell
├── apps/
│   ├── api/          NestJS 10 + Prisma 6 API (port 3091)
│   └── web/          Next.js 16 + Tailwind 4 app (port 3090)
├── tests/            Playwright e2e suite
├── scripts/          reset-db.ps1, pw-global-setup.mjs
├── docs/             setup.md (incl. Neon Auth walkthrough)
├── .env.local.example
└── .env.test.example
```

## Prerequisites

- Node.js 24 LTS
- Docker (for the `nux-dev-postgres` service defined in the
  repository root `docker-compose.yml`)
- Playwright browsers: `npx playwright install chromium`

## Quick start

```powershell
# 1. Copy the environment contract and adjust if needed
copy .env.local.example .env.local
copy .env.test.example .env.test

# 2. Install dependencies (run once per workspace)
npm install                 # root: Playwright
npm --prefix apps/api install
npm --prefix apps/web install

# 3. Start the database
docker compose up -d nux-dev-postgres

# 4. Reset and seed the development database
./scripts/reset-db.ps1

# 5. Run both apps
npm --prefix apps/api run start:dev     # http://localhost:3091/api
npm --prefix apps/web run dev           # http://localhost:3090
```

## Environment contract

Environment files live at the **project root** and are shared by both
apps:

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.local` | Local development values | No (real values) |
| `.env.local.example` | Template with safe defaults | Yes |
| `.env.test` | Automated test values (`NODE_ENV=test`, `nuxwell_test` DB) | No |
| `.env.test.example` | Template for tests | Yes |

Both apps resolve the file by walking up from their own directory, so
they can be started from the project root or via `npm --prefix`.

**Database separation:** the API picks the env file from `NODE_ENV`:

- `development` (default) → `.env.local` → `nuxwell_dev`
- `test` → `.env.test` → `nuxwell_test`

Automated tests never touch `nuxwell_dev`.

## Testing

```powershell
# Full suite: Jest (unit + supertest e2e), then Playwright
# (both migrate and seed nuxwell_test automatically)
npm test

# Only the API Jest tests
npm --prefix apps/api test

# Only the Playwright e2e suite (starts both servers)
npm run test:e2e
```

Current status: Jest 9/9 and Playwright 9/9 passing.

## Authentication

The app ships with optional Neon Managed Better Auth. When
`NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` are unset, the web
app runs in **local development mode**: every route is open and the
sign-in/registration pages explain how to enable real auth. See
[docs/setup.md](docs/setup.md) for the full auth setup.

## Deployment notes

- **API (Render):** all values are injected as real environment
  variables; no env file is read in production.
- **Web:** set `NEXT_PUBLIC_API_URL` to the deployed API origin.
