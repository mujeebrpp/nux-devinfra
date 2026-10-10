# NuxWell — MVP Scope

Wellness facility discovery, availability, booking, customer accounts
and an admin facility-management workflow.

## First complete business workflow

1. Customer opens facilities (public homepage + listing)
2. Views facility and service details
3. Checks availability
4. Creates a booking
5. Sees the booking in their dashboard
6. Admin manages facilities and bookings

## Included in the MVP

- Public homepage and facility listing with search and pagination.
- Facility details: services, duration, capacity and pricing.
- Customer registration and login (Neon Auth).
- Availability lookup and booking creation.
- Customer dashboard: booking history and cancellation where allowed.
- Admin: facility/service management and booking list.
- Seed data: facilities, services, membership plans and a demo
  account (`demo@nuxwell.local`) plus an admin account
  (`admin@nuxwell.local`).
- Database-backed health endpoint and end-to-end booking tests.

## Deferred

Payments, recurring family-group booking, memberships with complex
entitlements, trainer scheduling, AI fitness testing, leaderboards.

## Booking integrity (critical requirement)

Hiding unavailable slots in the UI is **not sufficient**. The API and
database path must enforce:

1. **No capacity overbooking.** Booking creation runs in a transaction
   that counts existing non-cancelled bookings overlapping the requested
   `[startsAt, endsAt)` window for the facility and rejects the request
   when `existing + 1 > facility.capacity`.
2. **Valid time window.** `endsAt > startsAt`; duration must match the
   selected service's `durationMinutes`.
3. **Referential integrity.** The booking must reference an active
   facility, an active service of that facility, and the authenticated
   user.
4. **Cancellation rules.** Only the booking owner (or an admin) can
   cancel; only bookings in a cancellable status (`PENDING`/`CONFIRMED`)
   can be cancelled; cancellation is immediate and frees the capacity.

Concurrency control: the overlap check and the insert happen inside a
single Prisma transaction; under contention the transaction retries or
fails cleanly with a `409 Conflict` response.

## Current state (see audit.md)

The `Booking` model and seed data already exist. The bookings API
module, availability endpoint, cancellation, auth guards and the web
booking flow are **not yet implemented** — this is the Phase 1
vertical slice.

## Acceptance criteria

- A customer can complete the booking workflow in the UI against a
  real test database.
- Two concurrent bookings that would exceed facility capacity cannot
  both succeed (tested with parallel requests).
- Overlapping-window validation, invalid duration and unknown
  facility/service all return standard 4xx errors.
- Unauthenticated users cannot create/cancel bookings; non-admin
  users cannot manage facilities.
