# ERD

Source of truth: `packages/database/prisma/schema.prisma`
(open it in Prisma Studio via `pnpm db:studio` for a visual diagram).

```text
User ──< RefreshToken, Notification, Refund(requested/reviewed), AuditLog
Category ──< Product ──< OrderItem >── Order
Product ──< ProductIngredient >── Ingredient
RestaurantTable ──< Order ──< Payment, Refund
RestaurantTable ──< Reservation
Payment ──< Refund
Coupon (applied by code on Order)
LoyaltyAccount ──< LoyaltyPointEntry
Report (daily AI summaries)
Restaurant (singleton profile/branding)
```

Money rules encoded in relations: payments and refunds `Restrict` their
order (financial history is append-only); recipes `Cascade` from products
but `Restrict` ingredients in use; order items `Cascade` with their order.
