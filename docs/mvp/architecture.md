# Target Architecture

## Operating model

- Developer workstation: Windows 10/11, Docker Desktop, WSL2 Ubuntu and VS Code.
- Docker Desktop owns the local container runtime; use WSL integration rather than installing a second Docker Engine unless there is a specific requirement.
- One shared local PostgreSQL server provides separate databases for each application and environment. Sharing the server does not mean sharing application schemas or credentials.
- Each product deploys as its own Next.js web service and NestJS API service.

## Local infrastructure

| Service | Image | Purpose |
|---|---|---|
| PostgreSQL | `postgres:17` | Local database server |
| pgAdmin | `dpage/pgadmin4` | Database administration |
| Mailpit | `axllent/mailpit` | Local SMTP capture and email preview |

Compose has PostgreSQL health checking, persistent volumes and pgAdmin dependency on healthy PostgreSQL. `postgres/init/01-databases.sql` initializes the six databases on first volume creation.

No Redis, message broker or Kubernetes is in MVP scope.

## Ports and databases

| Application | Web | API | Development DB | Test DB |
|---|---:|---:|---|---|
| NuxWell | 3090 | 3091 | `nuxwell_dev` | `nuxwell_test` |
| NuxFarm | 3092 | 3093 | `nuxfarm_dev` | `nuxfarm_test` |
| NuxCafe | 3094 | 3095 | `nuxcafe_dev` | `nuxcafe_test` |

Shared service defaults in `.env.example`: PostgreSQL host port 5432, pgAdmin 5050, Mailpit UI 8025 and SMTP 1025. If PostgreSQL host port 5432 is already occupied, a developer may set `POSTGRES_PORT=5433` in their ignored local `.env`; update application host URLs consistently. Inside Docker networking, PostgreSQL remains port 5432 and pgAdmin should connect to host `postgres`, port 5432.

Never document a machine-specific port as if it were a repository-wide default.

## Application separation

Each application owns its:

- Next.js web app and NestJS API app;
- Prisma schema, migration history, generated client and seed;
- `*_dev` and `*_test` database URLs;
- tests, environment examples and README;
- Render services and production database credentials.

A product must start and be deployed independently of the other two.

## Technology standards

| Layer | Standard |
|---|---|
| Web | Next.js 16 App Router, TypeScript |
| UI | Tailwind CSS v4; shadcn/ui where already used |
| API | NestJS 10, TypeScript |
| Database | PostgreSQL 17 locally; Neon PostgreSQL in production |
| ORM | Prisma 6, per-application schema and migrations |
| Validation | Validate all inputs; keep current class-validator or Zod approach unless a concrete defect motivates change |
| Authentication | Neon Auth / managed Better Auth integration; optional only in local development |
| Testing | Jest, Supertest and Playwright |
| Local environment | Docker Desktop, Compose and WSL2 |
| Hosting | GitHub, Render and Neon |
| Email | Mailpit locally; production email provider configured by environment |

## Environment contracts

- Development selects `.env.local` and a matching `*_dev` database.
- Test selects `.env.test` and a matching `*_test` database.
- Production uses injected platform environment variables; do not read developer env files.
- Validate required variables at startup and stop on invalid configuration.
- Never commit real credentials, access tokens, session secrets, private user data or production URLs in examples.
- The test-database guard must run before migrations, cleanup or writes, in every test entry point (Jest, Playwright, scripts and CI).

## API conventions

- All APIs use the `/api` prefix, including health endpoints. NuxFarm's source-level bootstrap must be aligned with NuxWell/NuxCafe and the clients/smoke scripts updated in the same change.
- Validate request bodies, query parameters and path values. Reject unknown fields where the framework supports it.
- Return consistent error responses and capped pagination metadata (`page`, `limit`, `total`, `totalPages`) on list endpoints.
- Set CORS allowlists explicitly from environment variables.
- Enforce authentication, roles and resource ownership in the API. UI hiding is never an access-control boundary.
- Add request correlation IDs and avoid logging secrets or sensitive personal information.

## Release architecture

GitHub pull request → CI → reviewed merge → explicit Prisma release migration → Render web/API deploy → remote smoke test. Each app has separate Neon credentials/database. Migrations are not run automatically in production API startup.

## MVP non-goals

Kubernetes, Redis, a central cross-product admin console, online payments, delivery integrations, accounting suite, predictive AI, leaderboards, IoT automation and unreviewed agronomic recommendations.
