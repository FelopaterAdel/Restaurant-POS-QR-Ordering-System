import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { CouponRepository } from "../repositories/coupon.repository.js";
import {
  CouponAlreadyExistsError,
  CreateCouponUseCase,
} from "../use-cases/create-coupon.use-case.js";
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

describe("CreateCouponUseCase", () => {
  it("creates a coupon with a normalized code", async () => {
    const repository = createMockRepository();
    const useCase = new CreateCouponUseCase(repository);
    const coupon = buildCoupon();

    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockResolvedValueOnce(coupon);

    const result = await useCase.execute({
      code: "welcome10",
      discountType: "PERCENT",
      value: 10,
    });

    expect(repository.findByCode).toHaveBeenCalledWith("WELCOME10");
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: "WELCOME10" }),
    );
    expect(result).toEqual(coupon);
  });

  it("rejects a duplicate coupon code", async () => {
    const repository = createMockRepository();
    const useCase = new CreateCouponUseCase(repository);

    vi.mocked(repository.findByCode).mockResolvedValueOnce(
      buildCoupon({ code: "WELCOME10" }),
    );

    await expect(
      useCase.execute({
        code: "WELCOME10",
        discountType: "PERCENT",
        value: 10,
      }),
    ).rejects.toBeInstanceOf(CouponAlreadyExistsError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate code reported by the database", async () => {
    const repository = createMockRepository();
    const useCase = new CreateCouponUseCase(repository);

    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`code`)",
      { code: "P2002", clientVersion: "7.9.1" },
    );

    vi.mocked(repository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockRejectedValueOnce(p2002);

    await expect(
      useCase.execute({
        code: "WELCOME10",
        discountType: "FIXED",
        value: 50,
      }),
    ).rejects.toBeInstanceOf(CouponAlreadyExistsError);
  });

  it("rejects a percent value above 100", async () => {
    const repository = createMockRepository();
    const useCase = new CreateCouponUseCase(repository);

    await expect(
      useCase.execute({
        code: "TOOMUCH",
        discountType: "PERCENT",
        value: 150,
      }),
    ).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
