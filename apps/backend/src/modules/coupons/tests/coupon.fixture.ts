import { CouponDiscountType, Prisma } from "@restaurant/database";
import type { Coupon } from "@restaurant/database";

export function buildCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: "coupon_1",
    code: "WELCOME10",
    discountType: CouponDiscountType.PERCENT,
    value: new Prisma.Decimal(10),
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
