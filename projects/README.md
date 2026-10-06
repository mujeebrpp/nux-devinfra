# Nux Project Dev/Test Initialization

These are clean environment contracts for the three Nux application projects.

## Projects

| Project | Web | API | PostgreSQL dev | PostgreSQL test |
|---|---:|---:|---|---|
| NuxWell | 3090 | 3091 | nuxwell_dev | nuxwell_test |
| NuxFarm | 3092 | 3093 | nuxfarm_dev | nuxfarm_test |
| NuxCafe | 3094 | 3095 | nuxcafe_dev | nuxcafe_test |

## Standard stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- NestJS 10
- Prisma + PostgreSQL
- Zod
- Playwright + Jest
- Neon Auth for application authentication
- No Redis

## Local architecture

Windows / WSL2
→ Docker Desktop
→ PostgreSQL + pgAdmin + Mailpit
→ project application

Each project gets its own development and test database. Test runs must never use a development or production database.

## Authentication

Use a dedicated Neon Auth development environment for local development and automated tests. Production authentication remains isolated.

## Environment files

Copy the appropriate example into the application repository:

- `.env.local` for development
- `.env.test` for automated tests

Never commit real secrets.

## Suggested repository structure

Each application repository can use:

```
apps/
  web/
  api/
prisma/
tests/
scripts/
```

The existing NuxWell and NuxFarm repositories are not modified by this initialization commit. NuxCafe can use this contract when its GitHub repository is created.
