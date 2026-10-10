# NuxWell — MVP Scope

Wellness facility discovery and safe booking, with customer history and a protected facility-management workflow. Retain the current facilities/services schema and extend it to complete the workflow.

## Primary workflow

1. Customer browses/searches available facilities.
2. Customer opens facility and service details including duration, capacity and price.
3. Customer checks availability for a valid time window.
4. Customer creates a booking.
5. Customer views booking history and cancels a cancellable booking.
6. Admin manages facilities/services and reviews bookings.

## MVP scope

- Public facility listing with search/pagination and detail pages.
- Services tied to facilities, including duration and booking capacity rules.
- Neon Auth integration and local user mapping through `authSubjectId`.
- Availability lookup, booking creation, booking history and cancellation.
- Admin facility/service management and booking list.
- Database-backed health endpoint, seed data and API/E2E tests.
- Usable loading, empty, validation, success and error states.

Payments, recurring family booking, complex membership entitlements, trainer scheduling, AI fitness testing and leaderboards remain deferred.

## Booking integrity

The UI's availability result can become stale. Booking creation must revalidate and enforce the invariant on the server and in the database transaction:

- `endsAt > startsAt`; duration matches the selected service.
- Facility and service are active, and service belongs to the facility.
- Only authenticated users can create bookings; user identity is derived from the validated session, not trusted from arbitrary request bodies.
- Capacity rules include all non-cancelled bookings that overlap the requested half-open interval `[startsAt, endsAt)`.
- Cancellation requires booking ownership or admin permission and a cancellable state.
- Booking create and cancellation are transaction-safe under contention. Choose and document a PostgreSQL locking/constraint/serializable strategy; a count followed by insert under ordinary read-committed isolation may still oversell under concurrent requests.
- Conflict and capacity violations return predictable `409 Conflict`; malformed or invalid inputs return appropriate 4xx responses.

If the business rule is a capacity count shared by overlapping bookings, implement concurrency protection at the correct capacity scope (facility, service, resource or slot). Do not assume a simple unique constraint alone handles arbitrary overlapping time ranges.

## Current baseline and remaining work

The repository currently has facility/service data, the Booking model, seed data and facility-oriented pages/API. Based on the source audit, the booking domain is not yet complete.

- [ ] Implement availability, create, list/history and cancellation endpoints.
- [ ] Implement session-to-local-user mapping and API role/ownership guards.
- [ ] Add facility/service detail and booking UI states.
- [ ] Add transactional capacity/overlap prevention and concurrency tests.
- [ ] Add Playwright journey covering create → history → cancel.
- [ ] Ensure all test setup refuses any database name not ending in `_test`.

## Acceptance criteria

- A customer can book using the UI and see the booking in their dashboard.
- Invalid facility/service, duration or time range is rejected.
- Parallel requests cannot exceed configured capacity.
- Only the booking owner or a permitted admin can cancel.
- Anonymous users and non-admins are blocked from protected endpoints.
- Tests run only against `nuxwell_test` and do not rely on development data.
