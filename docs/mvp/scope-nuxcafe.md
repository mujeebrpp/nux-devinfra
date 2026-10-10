# NuxCafe — MVP Scope

Ingredients, recipes, menu items, orders, kitchen production and auditable stock movements for a small snack kitchen. The current code already has substantial domain functionality; the MVP emphasis is authorization and proving stock integrity under failure and concurrency.

## Primary workflow

1. Register ingredients and opening stock.
2. Create recipes with measured ingredient quantities.
3. Create menu items and selling prices.
4. Create an order whose totals are calculated by the server.
5. Track production status.
6. Complete or cancel the order under allowed state transitions.
7. Review stock balances, low-stock warnings and daily sales totals.

## MVP scope

- Ingredients with explicit units, unit cost, current stock and low-stock threshold.
- Recipes and recipe items with computed ingredient cost.
- Menu items, categories, preparation metadata, price and availability.
- Order lines, server-calculated totals and explicit status transitions.
- Production batches and history.
- Stock adjustments and consumption movements with audit trail.
- Dashboard for sales/order summaries and low-stock warnings.
- API-side authentication, role/ownership enforcement and integration tests.

Online payments, delivery integration, accounting, advanced procurement, multi-branch operations and predictive demand planning remain deferred.

## Stock and order integrity

Preserve and test the current transactional completion design:

1. Validate order items and compute the order total from trusted, current menu prices on the server.
2. Before completion, verify required stock from the recipe requirements.
3. In one transaction, consume ingredient stock, write corresponding usage movements, transition eligible production runs/order state and create the sale record.
4. If any operation fails, the whole transaction rolls back.
5. Cancellation before completion must not consume stock. Completed orders should not be silently cancelled in a way that erases the sale/stock history; define an explicit reversal workflow if post-completion refunds are ever added.

Additional requirements:
- Guard state transitions so duplicate completion calls are idempotent or rejected.
- Protect against concurrent orders consuming the same remaining stock. Use transaction isolation or row-level locking and retry/409 behavior as appropriate; preflight reads alone do not prevent overselling.
- Keep stock balance and stock movement ledger reconcilable. Any manual adjustment must create an auditable movement.
- Calculate low-stock state consistently from current balance and threshold.

## Current baseline and remaining work

The current branch includes ingredient/menu/recipe/stock/production/order/sales modules, a web dashboard and an order completion transaction. Repository README/commit history reports Jest and Playwright coverage; rerun CI before considering the counts current.

- [ ] Inventory all routes and enforce auth and kitchen/admin roles at API level.
- [ ] Add tests for insufficient stock, transaction rollback and cancellation.
- [ ] Add concurrent/duplicate order completion tests.
- [ ] Verify low-stock warnings and daily totals against underlying stock/sale records.
- [ ] Verify production auth configuration fails closed.
- [ ] Ensure test guards cover Jest, Playwright and helper scripts and refuse non-`_test` databases.

## Acceptance criteria

- Completion creates one sale and matching ingredient usage movements.
- Insufficient stock changes no order, production, sale or stock state.
- Cancelled incomplete orders do not consume stock.
- Concurrent or repeated completion cannot double-consume stock or create duplicate sales.
- Role checks are enforced by the API, not solely by dashboard navigation.
- All acceptance tests run against `nuxcafe_test`.
