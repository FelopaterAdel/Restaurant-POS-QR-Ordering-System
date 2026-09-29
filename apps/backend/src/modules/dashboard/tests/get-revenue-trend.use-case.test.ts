import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { GetRevenueTrendUseCase } from "../use-cases/get-revenue-trend.use-case.js";

function payment(paidAt: string, amount: number) {
  return {
    paidAt: new Date(paidAt),
    amount: new Prisma.Decimal(amount),
  };
}

describe("GetRevenueTrendUseCase", () => {
  it("buckets revenue by day and fills empty days", async () => {
    const repository = {
      findPaidPayments: vi.fn().mockResolvedValue([
        payment("2026-09-20T10:00:00Z", 100),
        payment("2026-09-20T18:00:00Z", 50),
        payment("2026-09-22T12:00:00Z", 200),
      ]),
    } as unknown as DashboardRepository;
    const useCase = new GetRevenueTrendUseCase(repository);

    const result = await useCase.execute({
      from: "2026-09-20",
      to: "2026-09-22",
      granularity: "day",
    });

    expect(result).toEqual([
      { key: "2026-09-20", amount: 150, orders: 2 },
      { key: "2026-09-21", amount: 0, orders: 0 },
      { key: "2026-09-22", amount: 200, orders: 1 },
    ]);
  });

  it("buckets revenue by week starting Monday", async () => {
    const repository = {
      findPaidPayments: vi.fn().mockResolvedValue([
        payment("2026-09-22T10:00:00Z", 100),
        payment("2026-09-27T10:00:00Z", 50),
        payment("2026-09-28T10:00:00Z", 300),
      ]),
    } as unknown as DashboardRepository;
    const useCase = new GetRevenueTrendUseCase(repository);

    const result = await useCase.execute({
      from: "2026-09-21",
      to: "2026-09-28",
      granularity: "week",
    });

    expect(result).toEqual([
      { key: "2026-09-21", amount: 150, orders: 2 },
      { key: "2026-09-28", amount: 300, orders: 1 },
    ]);
  });

  it("buckets revenue by month", async () => {
    const repository = {
      findPaidPayments: vi.fn().mockResolvedValue([
        payment("2026-08-31T10:00:00Z", 100),
        payment("2026-09-01T10:00:00Z", 200),
      ]),
    } as unknown as DashboardRepository;
    const useCase = new GetRevenueTrendUseCase(repository);

    const result = await useCase.execute({
      from: "2026-08-01",
      to: "2026-09-30",
      granularity: "month",
    });

    expect(result[0]).toEqual({ key: "2026-08", amount: 100, orders: 1 });
    expect(result[result.length - 1]).toEqual({
      key: "2026-09",
      amount: 200,
      orders: 1,
    });
    expect(result).toHaveLength(2);
  });
});
