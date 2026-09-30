# API

Interactive reference: `GET /api/docs` (Swagger UI) and
`GET /api/docs/openapi.json` when running the backend in development.

Conventions:

- Base path `/api/v1`, JSON everywhere.
- Success: `{ "success": true, "data": T }`, lists add `{ pagination }`.
- Errors: `{ "success": false, "error": { "code": "UPPER_SNAKE", "message" } }`.
- Auth: `Authorization: Bearer <accessToken>`; refresh via
  `POST /auth/refresh`. Roles enforced per route (OWNER, MANAGER,
  CASHIER, WAITER, KITCHEN).
- Public (no auth): health, bootstrap/login/refresh, public menu +
  orders, loyalty lookup, payment providers, Stripe/Paymob webhooks
  (provider-signed).

Main groups: health, auth, users, restaurant, categories, products,
tables, dashboard, analytics (`/dashboard/*`), reports, coupons,
loyalty, orders (+ queue/history/staff), payments (+ history, webhooks),
refunds, audit-log, reservations, inventory (`/ingredients`,
`/products/:id/recipe`), notifications.
