# Nux Dev Infrastructure

Reusable local development infrastructure and coordinated MVP workspace for NuxWell, NuxFarm and NuxCafe.

## Current MVP programme

The app implementations already contain working domain code; the next step is stabilization and completing missing end-to-end capabilities, not a wholesale rewrite.

**Start here:** [MVP programme overview](docs/mvp/README.md)

The plan includes a source-level repository audit, architecture and port contracts, per-app scopes, ordered milestones, acceptance criteria, a detailed [feature-by-feature TODO backlog](docs/mvp/feature-breakdown.md), and a Render/Neon release runbook.

## Architecture

- Windows + Docker Desktop; WSL2 Ubuntu uses Docker Desktop integration
- PostgreSQL 17 shared local server; separate database per product and environment
- pgAdmin for database administration
- Mailpit for local SMTP/email testing
- No Redis

## Local databases

| App | Development | Automated tests |
|---|---|---|
| NuxWell | `nuxwell_dev` | `nuxwell_test` |
| NuxFarm | `nuxfarm_dev` | `nuxfarm_test` |
| NuxCafe | `nuxcafe_dev` | `nuxcafe_test` |

Never point automated tests, test migrations or test cleanup at a development or production database. Test setup must refuse to proceed unless the selected database name ends with `_test`.

## Ports

Defaults in `.env.example` are shown below. A developer can override `POSTGRES_PORT` in their ignored local `.env` (for example, 5433 if host port 5432 is occupied). The PostgreSQL port inside Docker networking remains 5432.

| Service | Host port default |
|---|---:|
| PostgreSQL | 5432 |
| pgAdmin | 5050 |
| Mailpit UI | 8025 |
| Mailpit SMTP | 1025 |

| Application | Web | API |
|---|---:|---:|
| NuxWell | 3090 | 3091 |
| NuxFarm | 3092 | 3093 |
| NuxCafe | 3094 | 3095 |

## Start local services

### Windows PowerShell

```powershell
Copy-Item .env.example .env
# Edit .env and replace all example passwords before starting.
docker compose config
docker compose up -d
docker compose ps
```

### WSL2 Ubuntu

Run from the repository directory mounted into WSL. With Docker Desktop WSL integration enabled, do not install another Docker Engine inside Ubuntu unless needed for a deliberate separate runtime.

```bash
cp .env.example .env
# Edit .env and replace all example passwords before starting.
docker compose config
docker compose up -d
docker compose ps
```

For details on per-project install, migration, seed and test commands, use each project README under `projects/`.

## Database connection rules

From the host machine, use `localhost:<POSTGRES_PORT>` and a project database name. From pgAdmin (which runs inside the Compose network), use host `postgres`, port `5432`, database `postgres`, username `postgres` and the password from `.env`.

Example host URL (substitute local values; never commit the actual URL):

```text
postgresql://postgres:<PASSWORD>@localhost:<POSTGRES_PORT>/nuxwell_dev
```

Change the database name to the corresponding `*_test` value for automated tests.

## Destructive reset warning

`docker compose down -v` removes the shared PostgreSQL data volume and **deletes every local project database**. Use only when a complete local data reset is intended. Prefer the confirmation-protected reset script after reviewing its target and the current backup/export state. A reset is not part of normal setup or documentation updates.

## Deployment

Production hosting is designed separately from local development:

- GitHub for source control and CI
- Render for three independent web services and three APIs
- Neon PostgreSQL with separate per-app production databases/credentials
- Neon Auth required in production

Production uses platform-injected environment variables, not local `.env` files. Run Prisma migrations as an explicit release step; do not auto-migrate in API startup. See [deployment and rollback](docs/mvp/deployment.md).
