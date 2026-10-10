# Nux Dev Platform — MVP Programme

Coordinated MVP programme covering four deliverables: the shared development
platform (**Nux Dev Infrastructure**) and three independently deployable business
applications (**NuxWell**, **NuxFarm**, **NuxCafe**).

The goal is not to finish three complete business products at once. First we
establish a reliable shared development platform, then deliver one working
business workflow per application using the same engineering standards.

## Document index

| Document | Purpose |
|---|---|
| [architecture.md](architecture.md) | Target architecture, ports, technology standards, non-goals |
| [scope-nuxwell.md](scope-nuxwell.md) | NuxWell MVP scope: facility discovery, availability, booking, dashboard, admin |
| [scope-nuxfarm.md](scope-nuxfarm.md) | NuxFarm MVP scope: farms, crop cycles, tasks, irrigation, import, dashboard |
| [scope-nuxcafe.md](scope-nuxcafe.md) | NuxCafe MVP scope: ingredients, recipes, menu, orders, production, stock |
| [milestones.md](milestones.md) | Phase 0–4 plan with exit gates, mapped to backlog epics |
| [acceptance-criteria.md](acceptance-criteria.md) | Definition of Done and per-application acceptance tests |
| [deployment.md](deployment.md) | Render/Neon deployment design, release steps, rollback runbook |
| [audit.md](audit.md) | Audit of the current repository: what exists, what is missing, Phase 0 fix list |

## Backlog epics (initial GitHub Issues / Project board)

| Epic | Priority | Area |
|---|---|---|
| INF-1 Infrastructure hardening | P0 | Platform |
| INF-2 Environment and database safety | P0 | Platform |
| INF-3 CI build and test pipeline | P0 | Platform |
| NW-1 Facilities and services | P1 | NuxWell |
| NW-2 Availability and booking integrity | P1 | NuxWell |
| NW-3 Customer dashboard and admin | P1 | NuxWell |
| NF-1 Farm locations and crop cycles | P1 | NuxFarm |
| NF-2 Tasks and irrigation logs | P1 | NuxFarm |
| NC-1 Ingredients, recipes and menu | P1 | NuxCafe |
| NC-2 Orders, production and stock | P1 | NuxCafe |
| REL-1 Security, smoke tests and release | P0 | All |

## Guiding principles

1. **Shared standards, not shared data.** The three applications share
   engineering patterns and scripts — never a business database or a common
   API that couples them.
2. **One vertical slice at a time.** Each application gets one genuinely usable
   workflow end to end (UI → validated API → migrated database → tests) before
   the next feature is started.
3. **Test isolation is a hard safety control.** Automated tests only ever run
   against `*_test` databases. Development and production data are never used.
4. **Use the existing stack.** Next.js 16 App Router, Tailwind CSS v4, shadcn/ui,
   NestJS 10, Prisma 6, Zod, PostgreSQL 17 (local) / Neon (production), Jest,
   Supertest, Playwright, Docker Desktop, Render. No new framework or
   infrastructure service is introduced during the MVP.
