# Target Architecture

## Developer workstation

- Windows 10/11, Docker Desktop, WSL2 Ubuntu, VS Code
- Local services run through Docker Desktop (WSL2 integration); no second
  Docker Engine inside Ubuntu unless specifically required

## Local infrastructure (Nux Dev Infrastructure)

One Docker Compose stack (`docker-compose.yml` at the repository root):

| Service | Image | Purpose |
|---|---|---|
| PostgreSQL | `postgres:17` | Shared database server, one container |
| pgAdmin | `dpage/pgadmin4` | Database administration |
| Mailpit | `axllent/mailpit` | Local email testing (SMTP + UI) |

- Persistent volume for PostgreSQL data; health check on the Postgres service;
  pgAdmin waits for a healthy Postgres.
- `postgres/init/01-databases.sql` creates six databases on first volume
  initialization: development and test databases for each application.
- PowerShell scripts at `scripts/`: `up.ps1`, `down.ps1`, `status.ps1`,
  `reset.ps1` (reset requires typing `RESET` and recreates the volume).
- No Redis, no message broker, no Kubernetes.

## Application topology

Each application is an independently deployable pair with its own schema,
migrations, credentials, ports and deployment:

| Application | Web | API | Dev database | Test database |
|---|---:|---:|---|---|
| NuxWell | `:3090` | `:3091` | `nuxwell_dev` | `nuxwell_test` |
| NuxFarm | `:3092` | `:3093` | `nuxfarm_dev` | `nuxfarm_test` |
| NuxCafe | `:3094` | `:3095` | `nuxcafe_dev` | `nuxcafe_test` |

Each app can start without the other two. Each app resolves its environment
from `.env.local` (development) or `.env.test` (automated tests) at the
project root; the API picks the file based on `NODE_ENV`.

## Technology standards

| Layer | Standard |
|---|---|
| Web | Next.js 16 App Router, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui |
| API | NestJS 10, TypeScript |
| Database | PostgreSQL 17 locally; Neon PostgreSQL in production |
| ORM | Prisma 6 (per-app schema, migrations and seed) |
| Validation | Zod for shared/web validation; class-validator or a consistent Zod integration for API DTOs |
| Authentication | Neon Auth (Managed Better Auth); enforced in production, optional open mode locally |
| Testing | Jest, Supertest, Playwright |
| Local infrastructure | Docker Desktop, Docker Compose, WSL2 |
| Deployment | GitHub, Render, Neon |
| Email testing | Mailpit locally; configured provider in production |

## Repository layout

```
nux-devinfra/
├── docker-compose.yml          # postgres + pgadmin + mailpit
├── postgres/init/              # six-database init SQL
├── scripts/                    # up / down / status / reset (+ migrate-all, seed-all)
├── docs/mvp/                   # this programme documentation
└── projects/
    ├── nuxwell/                # apps/web, apps/api, prisma, tests, scripts
    ├── nuxfarm/                # apps/web, apps/api, prisma, tests, scripts
    └── nuxcafe/                # apps/web, apps/api, prisma, tests, scripts
```

Each project keeps independent `apps/web`, `apps/api`, Prisma schema,
migrations, seed and tests, plus its own README and environment examples
(`.env.local.example`, `.env.test.example`). Real secrets are never committed.

## Non-goals for the MVP (deferred)

- Kubernetes, microservice splitting, Redis, complex observability infrastructure
- A central cross-product admin portal
- Payments, delivery integrations, accounting, advanced purchasing
- AI features, leaderboards, predictive analytics, automatic agronomic
  recommendations

## API conventions

- Consistent `/api` global prefix on every NestJS API (NuxWell and NuxCafe
  already do this; NuxFarm is brought into line in Phase 0).
- DTO validation on every input; standard error responses via a shared
  exception filter pattern.
- Pagination metadata (`page`, `limit`, `total`, `totalPages`) on list
  endpoints; capped `limit` (max 100).
- Structured logs with request IDs where supported by the framework.
