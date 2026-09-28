import { CouponDiscountType, Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { CouponRepository } from "../repositories/coupon.repository.js";
import {
  calculateCouponDiscount,
  CouponExpiredError,
  CouponInactiveError,
  CouponMaxUsesReachedError,
  CouponNotFoundError,
  ValidateCouponUseCase,
} from "../use-cases/validate-coupon.use-case.js";
import { buildCoupon } from "./coupon.fixture.js";

function createMockRepository(
  overrides: Partial<CouponRepository> = {},
): CouponRepository {
  return {
    findById: vi.fn(),
    findByCode: vi.fn(),
    findAll: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    ...overrides,
  } as unknown as CouponRepository;
}

describe("ValidateCouponUseCase", () => {
  it("returns a usable coupon regardless of code casing", async () => {
    const repository = createMockRepository();
    const useCase = new ValidateCouponUseCase(repository);
    const coupon = buildCoupon();

    vi.mocked(repository.findByCode).mockResolvedValueOnce(coupon);

    const result = await useCase.execute("  welcome10 ");
    expect(repository.findByCode).toHaveBeenCalledWith("WELCOME10");
    expect(result).toEqual(coupon);
  });

  it("throws when the coupon does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new ValidateCouponUseCase(repository);

    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);

    await expect(useCase.execute("MISSING")).rejects.toBeInstanceOf(
      CouponNotFoundError,
    );
  });

  it("throws for inactive, expired and exhausted coupons", async () => {
    const repository = createMockRepository();
    const useCase = new ValidateCouponUseCase(repository);

    vi.mocked(repository.findByCode).mockResolvedValueOnce(
      buildCoupon({ isActive: false }),
    );
    await expect(useCase.execute("X")).rejects.toBeInstanceOf(
      CouponInactiveError,
    );

    vi.mocked(repository.findByCode).mockResolvedValueOnce(
      buildCoupon({ expiresAt: new Date("2020-01-01T00:00:00.000Z") }),
    );
    await expect(useCase.execute("X")).rejects.toBeInstanceOf(
      CouponExpiredError,
    );

    vi.mocked(repository.findByCode).mockResolvedValueOnce(
      buildCoupon({ maxUses: 5, usedCount: 5 }),
    );
    await expect(useCase.execute("X")).rejects.toBeInstanceOf(
      CouponMaxUsesReachedError,
    );
  });
});

describe("calculateCouponDiscount", () => {
  it("calculates percent discounts", () => {
    const discount = calculateCouponDiscount(
      200,
      { discountType: CouponDiscountType.PERCENT, value: new Prisma.Decimal(10) },
    );
    expect(discount.toNumber()).toBe(20);
  });

  it("caps fixed discounts at the subtotal", () => {
    const discount = calculateCouponDiscount(
      80,
      { discountType: CouponDiscountType.FIXED, value: new Prisma.Decimal(100) },
    );
    expect(discount.toNumber()).toBe(80);
  });

  it("returns zero for a zero subtotal", () => {
    const discount = calculateCouponDiscount(
      0,
      { discountType: CouponDiscountType.PERCENT, value: new Prisma.Decimal(50) },
    );
    expect(discount.toNumber()).toBe(0);
  });
});
