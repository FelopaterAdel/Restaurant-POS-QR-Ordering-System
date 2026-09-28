import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { buildOrder } from "../../orders/tests/order.fixture.js";
import { LoyaltyRepository } from "../repositories/loyalty.repository.js";
import { AwardLoyaltyPointsUseCase } from "../use-cases/award-loyalty-points.use-case.js";

function setup() {
  const orderRepository = {
    findById: vi.fn(),
  } as unknown as OrderRepository;
  const loyaltyRepository = {
    findAccountByPhone: vi.fn(),
    findEntryByOrderId: vi.fn(),
    findEntriesByAccountId: vi.fn(),
    awardForOrder: vi.fn(),
  } as unknown as LoyaltyRepository;
  const useCase = new AwardLoyaltyPointsUseCase(
    orderRepository,
    loyaltyRepository,
  );
  return { orderRepository, loyaltyRepository, useCase };
}

function entry(points: number, expiresAt: Date) {
  return {
    id: `entry_${points}_${expiresAt.getTime()}`,
    accountId: "acc_1",
    points,
    orderId: "order_1",
    earnedAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("AwardLoyaltyPointsUseCase", () => {
  it("awards points and summarizes balance, lifetime and tier", async () => {
    const { orderRepository, loyaltyRepository, useCase } = setup();

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({
        totalAmount: new Prisma.Decimal(350),
        customerPhone: "01012345678",
      }) as never,
    );
    vi.mocked(loyaltyRepository.awardForOrder).mockResolvedValueOnce({
      entry: entry(35, new Date("2030-01-01T00:00:00.000Z")),
      created: true,
    } as never);
    vi.mocked(loyaltyRepository.findAccountByPhone).mockResolvedValueOnce({
      id: "acc_1",
      phone: "01012345678",
    } as never);
    vi.mocked(loyaltyRepository.findEntriesByAccountId).mockResolvedValueOnce([
      entry(35, new Date("2030-01-01T00:00:00.000Z")),
    ] as never);

    const result = await useCase.execute({ orderId: "order_1" });

    expect(loyaltyRepository.awardForOrder).toHaveBeenCalledTimes(1);
    const awardCall = vi.mocked(loyaltyRepository.awardForOrder).mock
      .calls[0][0];
    expect(awardCall.phone).toBe("01012345678");
    expect(awardCall.orderId).toBe("order_1");
    expect(awardCall.points).toBe(35);
    expect(result.pointsEarned).toBe(35);
    expect(result.balance).toBe(35);
    expect(result.lifetimePoints).toBe(35);
    expect(result.tier).toBe("Bronze");
    expect(result.alreadyAwarded).toBe(false);
  });

  it("excludes expired entries from the balance but keeps lifetime", async () => {
    const { orderRepository, loyaltyRepository, useCase } = setup();

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({
        totalAmount: new Prisma.Decimal(100),
        customerPhone: "01012345678",
      }) as never,
    );
    vi.mocked(loyaltyRepository.awardForOrder).mockResolvedValueOnce({
      entry: entry(10, new Date("2030-01-01T00:00:00.000Z")),
      created: true,
    } as never);
    vi.mocked(loyaltyRepository.findAccountByPhone).mockResolvedValueOnce({
      id: "acc_1",
      phone: "01012345678",
    } as never);
    vi.mocked(loyaltyRepository.findEntriesByAccountId).mockResolvedValueOnce([
      entry(50, new Date("2020-01-01T00:00:00.000Z")),
      entry(10, new Date("2030-01-01T00:00:00.000Z")),
    ] as never);

    const result = await useCase.execute({ orderId: "order_1" });

    expect(result.balance).toBe(10);
    expect(result.lifetimePoints).toBe(60);
  });

  it("does not double-award the same order", async () => {
    const { orderRepository, loyaltyRepository, useCase } = setup();

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({
        totalAmount: new Prisma.Decimal(100),
        customerPhone: "01012345678",
      }) as never,
    );
    vi.mocked(loyaltyRepository.awardForOrder).mockResolvedValueOnce({
      entry: entry(10, new Date("2030-01-01T00:00:00.000Z")),
      created: false,
    } as never);
    vi.mocked(loyaltyRepository.findAccountByPhone).mockResolvedValueOnce({
      id: "acc_1",
      phone: "01012345678",
    } as never);
    vi.mocked(loyaltyRepository.findEntriesByAccountId).mockResolvedValueOnce([
      entry(10, new Date("2030-01-01T00:00:00.000Z")),
    ] as never);

    const result = await useCase.execute({ orderId: "order_1" });

    expect(result.pointsEarned).toBe(0);
    expect(result.alreadyAwarded).toBe(true);
  });
});
