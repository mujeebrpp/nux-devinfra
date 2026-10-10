# NuxCafe — MVP Scope

Ingredients, recipes, menu items, production and order tracking for a
small snack kitchen.

## First complete kitchen workflow

1. Register ingredients and units
2. Create recipes with ingredient quantities
3. Publish menu items with selling prices
4. Record an order
5. Record production and ingredient usage
6. Review order status and stock balance

## Included in the MVP

- Ingredients with units (`G | KG | ML | L | PCS`), unit cost,
  opening stock and low-stock thresholds.
- Recipes with ingredient quantities and estimated recipe cost.
- Menu items with selling prices, category, prep time and
  availability.
- Order creation and status tracking
  (`PENDING | PREPARING | READY | COMPLETED | CANCELLED`).
- Production batches with lifecycle
  (`QUEUED | IN_PROGRESS | COMPLETED | CANCELLED`).
- Stock adjustments and low-stock warnings on the dashboard.
- Basic daily order totals and production reports (sales summary).
- Role-based kitchen/admin access.

## Deferred

Online payments, delivery integrations, accounting, advanced
purchasing, multi-branch franchise management, complex demand
forecasting.

## Stock consistency (critical requirement)

Stock consumption must be recorded **transactionally**. A cancelled or
failed order must not silently leave stock in an incorrect state. The
implemented design (keep and extend):

1. Order creation validates every menu item slug, computes the total
   from current prices, and queues one production run per line.
2. Order completion runs a pre-flight stock check, then a single
   transaction that: decrements each ingredient, writes a `USAGE`
   stock movement per ingredient, completes the order's active
   production runs, marks the order `COMPLETED`, and creates the
   `Sale`. Any failure rolls the whole transaction back.
3. Cancellation only affects orders still in an active status and
   cancels their production runs — it never consumes stock, because
   stock is only consumed at completion.

## Current state (see audit.md)

NuxCafe is the most complete application: full domain schema, all API
modules (ingredients, menu-items, recipes, stock, production, orders,
sales, dashboard, health), the transactional order flow described
above, a full web dashboard with Neon Auth hooks, Jest (9 suites /
46 tests) and Playwright (13 smoke tests) with a test-database safety
contract, and a comprehensive README.

Remaining for the MVP: role-based access enforcement on the API,
low-stock warning verification, cancellation/failure-path tests, and
production auth enforcement.

## Acceptance criteria

- An order can be processed and ingredient usage reconciles exactly
  (stock movements balance against on-hand quantities).
- Completing an order with insufficient stock fails cleanly and
  changes nothing.
- Cancelling an order before completion leaves stock untouched.
- Unauthenticated/kitchen-role users cannot access admin actions.
