import { Prisma } from "@restaurant/database";
import type { Coupon } from "@restaurant/database";
import {
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import {
  normalizeCouponCode,
  CouponRepository,
} from "../repositories/coupon.repository.js";

export class CouponNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.COUPON_NOT_FOUND, "Coupon not found");
    this.name = "CouponNotFoundError";
  }
}

export class CouponInactiveError extends ConflictError {
  constructor() {
    super(AppErrorCode.COUPON_INACTIVE, "Coupon is no longer active");
    this.name = "CouponInactiveError";
  }
}

export class CouponExpiredError extends ConflictError {
  constructor() {
    super(AppErrorCode.COUPON_EXPIRED, "Coupon has expired");
    this.name = "CouponExpiredError";
  }
}

export class CouponMaxUsesReachedError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.COUPON_MAX_USES_REACHED,
      "Coupon has reached its maximum number of uses",
    );
    this.name = "CouponMaxUsesReachedError";
  }
}

/** Pure usability check shared by the use-case and the order transaction. */
export function assertCouponUsable(
  coupon: Coupon,
  now: Date = new Date(),
): void {
  if (!coupon.isActive) {
    throw new CouponInactiveError();
  }
  if (coupon.expiresAt && coupon.expiresAt <= now) {
    throw new CouponExpiredError();
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new CouponMaxUsesReachedError();
  }
}

/**
 * Discount in the currency base unit, capped at the subtotal so an order
 * can never go negative.
 */
export function calculateCouponDiscount(
  subtotal: InstanceType<typeof Prisma.Decimal> | number | string,
  coupon: Pick<Coupon, "discountType" | "value">,
): InstanceType<typeof Prisma.Decimal> {
  const base = new Prisma.Decimal(subtotal.toString());
  if (base.lte(0)) {
    return new Prisma.Decimal(0);
  }
  const raw =
    coupon.discountType === "PERCENT"
      ? base.mul(new Prisma.Decimal(coupon.value.toString())).div(100)
      : new Prisma.Decimal(coupon.value.toString());
  const floored = raw.toDecimalPlaces(2, Prisma.Decimal.ROUND_FLOOR);
  return Prisma.Decimal.min(floored, base);
}

export class ValidateCouponUseCase {
  private readonly couponRepository: CouponRepository;

  constructor(couponRepository: CouponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
  }

  async execute(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findByCode(
      normalizeCouponCode(code),
    );
    if (!coupon) {
      throw new CouponNotFoundError();
    }
    assertCouponUsable(coupon);
    return coupon;
  }
}
