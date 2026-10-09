# Nux Dev Infrastructure

Reusable local development infrastructure for NuxWell, NuxFarm, NuxCafe and future projects.

## Architecture

- Windows + Docker Desktop
- WSL2 Ubuntu can run `docker compose` through Docker Desktop WSL integration
- PostgreSQL 17 shared across projects
- pgAdmin for database administration
- Mailpit for local email testing
- No Redis

## Project databases

- `nuxwell_dev`
- `nuxwell_test`
- `nuxfarm_dev`
- `nuxfarm_test`
- `nuxcafe_dev`
- `nuxcafe_test`

## Ports

Ports are configurable in `.env` (defaults from
`.env.example` shown; this machine's `.env` uses
`POSTGRES_PORT=5433`):

| Service | `.env` variable | Default |
|---|---|---:|
| PostgreSQL | `POSTGRES_PORT` | 5432 |
| pgAdmin | `PGADMIN_PORT` | 5050 |
| Mailpit UI | `MAILPIT_UI_PORT` | 8025 |
| Mailpit SMTP | `MAILPIT_SMTP_PORT` | 1025 |

## Windows PowerShell

```powershell
cd C:\dev\infrastructure
Copy-Item .env.example .env
docker compose up -d
docker compose ps
```

## WSL2 Ubuntu

From the same Windows directory mounted into WSL:

```bash
cd /mnt/c/dev/infrastructure
cp .env.example .env
docker compose up -d
docker compose ps
```

With Docker Desktop WSL integration enabled, do not install a second Docker Engine inside Ubuntu unless you have a specific reason.

## Application database URLs

Replace `YOUR_PASSWORD` with `POSTGRES_PASSWORD` and
`PORT` with `POSTGRES_PORT` from your `.env` (5433 on
this machine).

### NuxWell

```
postgresql://postgres:YOUR_PASSWORD@localhost:PORT/nuxwell_dev
```

### NuxFarm

```
postgresql://postgres:YOUR_PASSWORD@localhost:PORT/nuxfarm_dev
```

### NuxCafe

```
postgresql://postgres:YOUR_PASSWORD@localhost:PORT/nuxcafe_dev
```

For automated tests, use the matching `*_test` database.

## Mailpit

SMTP:

```
SMTP_HOST=localhost
SMTP_PORT=1025
```

Web UI:

http://localhost:8025

## pgAdmin

Open http://localhost:5050.

When adding the PostgreSQL server from inside pgAdmin, use:

- Host: `postgres`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: value from `.env`

## Important database reset warning

`docker compose down -v` deletes the shared PostgreSQL data volume and therefore all local project databases.

Use it only when a full local database reset is intended.

## Production

Production application hosting is outside this repository:

- GitHub: source control and CI
- Render: Next.js / NestJS application hosting
- Neon PostgreSQL: production database
- Neon Auth: authentication

This repository is intentionally focused on reusable Windows/WSL local infrastructure.
