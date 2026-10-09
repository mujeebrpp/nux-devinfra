# NuxCafe

A cafe operations platform: menu, recipes, pantry stock, kitchen
production, orders and sales.

- **API** — NestJS 10 + Prisma 6 + PostgreSQL (`apps/api`, port 3095)
- **Dashboard** — Next.js 16 + Tailwind CSS 4 (`apps/web`, port 3094)
- **Database** — Docker service `nux-dev-postgres` (host port 5433),
  databases `nuxcafe_dev` and `nuxcafe_test`

## Quick start

```powershell
# 1. Install dependencies (root, api and web)
npm install
npm --prefix apps/api install
npm --prefix apps/web install

# 2. Set up the database (migrate + seed the dev database)
npm run db:migrate
npm run db:seed

# 3. Run everything
npm run dev
```

For a one-shot reset of both databases (recreate migrations,
generate the Prisma client, seed `nuxcafe_dev`, migrate
`nuxcafe_test`), run `./db-setup.ps1`.

Then open http://localhost:3094. The API health check is at
http://localhost:3095/api/health.

## Project layout

```
apps/api/                  NestJS API
  prisma/schema.prisma     Data model (Ingredient, MenuItem, Recipe,
                           RecipeItem, StockMovement, Production,
                           Order, OrderItem, Sale)
  prisma/seed.ts           Idempotent dev seed (13 ingredients,
                           8 menu items, recipes, sample orders)
  src/                     health, dashboard, menu-items, ingredients,
                           recipes, stock, production, orders, sales
apps/web/                  Next.js dashboard
  app/                     Home + /dashboard/* pages
  components/dashboard/    Client forms and action buttons
  lib/api/                 Typed API client (zod-validated)
tests/smoke.spec.ts        Playwright smoke tests (13 tests:
                            every dashboard page renders +
                            seeded data checks)
db-setup.ps1               One-shot dev + test database reset
```

## Environment

Copy the examples and adjust if your PostgreSQL password differs:

```powershell
Copy-Item .env.local.example .env.local
Copy-Item .env.test.example .env.test
```

Both files point at the shared Docker PostgreSQL on port 5433
(`nuxcafe_dev` / `nuxcafe_test`).

## Testing

```powershell
npm test          # Jest: 9 suites, 46 tests (unit + in-process API e2e)
npm run test:e2e  # Playwright: 13 smoke tests (boots API + web)
```

The Jest global setup (`apps/api/test/global-setup.js`) enforces a
safety contract: it refuses to run unless `DATABASE_URL` points at a
database whose name ends in `_test`, then runs
`prisma migrate deploy` against it. Automated tests never touch the
development database.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | API (watch) + web (dev) side by side |
| `npm run build` | Build API and web |
| `npm test` | Jest unit + e2e specs |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run db:migrate` | Create/apply migrations to `nuxcafe_dev` |
| `npm run db:seed` | Seed `nuxcafe_dev` (idempotent) |
| `npm run db:reset` | Reset `nuxcafe_dev` from migrations + reseed |

## API overview

All routes are prefixed with `/api`:

- `GET /api/health` — liveness + database check
- `GET /api/dashboard` — aggregate overview (today, kitchen, low stock, recent orders)
- `CRUD /api/menu-items` — menu items; `GET /api/menu-items/:slug` includes the recipe
- `CRUD /api/ingredients` — pantry SKUs with low-stock flags
- `GET/PUT/DELETE /api/recipes/:menuItemSlug` — recipe per menu item
- `GET /api/stock/levels`, `GET/POST /api/stock/movements` — stock levels + audit log
- `CRUD /api/production` + `POST /api/production/:id/{start,complete,cancel}`
- `POST /api/orders`, `POST /api/orders/:id/{complete,cancel}` — completing an order
  consumes ingredient stock (transactional) and records a sale
- `GET /api/sales/summary`, `GET /api/sales` — revenue reporting

## Notes

- Order completion is transactional: pre-flight stock check, decrement
  ingredients, record `USAGE` movements, complete active production
  runs, mark the order `COMPLETED`, then create the `Sale`.
- The seed is idempotent (upserts by slug); `SEED-` sample orders are
  recreated fresh on every run.
- Neon Auth integration hooks live in `apps/web/lib/auth` and
  `apps/web/app/api/auth/[...path]/route.ts`; when
  `NEON_AUTH_BASE_URL` / `NEON_AUTH_COOKIE_SECRET` are empty the app
  runs in open local-development mode.
