import { OrderStatus, Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { GetDashboardSummaryUseCase } from "../use-cases/get-dashboard-summary.use-case.js";

function createMockRepository(
  overrides: Partial<DashboardRepository> = {},
): DashboardRepository {
  return {
    findTodaySummary: vi.fn(),
    ...overrides,
  } as unknown as DashboardRepository;
}

describe("GetDashboardSummaryUseCase", () => {
  it("builds the summary with per-status order counts and sales from the repository", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findTodaySummary).mockResolvedValueOnce({
      orderCountsByStatus: [
        { status: OrderStatus.PENDING, count: 2 },
        { status: OrderStatus.PREPARING, count: 5 },
        { status: OrderStatus.READY, count: 3 },
        { status: OrderStatus.COMPLETED, count: 22 },
        { status: OrderStatus.CANCELLED, count: 3 },
      ],
      paidOrdersCount: 22,
      totalSales: new Prisma.Decimal(4250),
    });

    const result = await useCase.execute();

    expect(repository.findTodaySummary).toHaveBeenCalledWith(
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      }),
    );
    expect(result).toEqual({
      orders: {
        total: 35,
        pending: 2,
        confirmed: 0,
        preparing: 5,
        ready: 3,
        served: 0,
        completed: 22,
        cancelled: 3,
      },
      payments: {
        paidOrders: 22,
        totalSales: 4250,
      },
    });
  });

  it("defaults every status count and the sales total to zero when there is no data", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findTodaySummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 0,
      totalSales: null,
    });

    const result = await useCase.execute();

    expect(result.orders.total).toBe(0);
    expect(result.orders).toEqual({
      total: 0,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      completed: 0,
      cancelled: 0,
    });
    expect(result.payments).toEqual({
      paidOrders: 0,
      totalSales: 0,
    });
  });

  it("uses today's range in the restaurant timezone when no date is provided", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findTodaySummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 0,
      totalSales: null,
    });

    const now = new Date("2026-08-09T18:30:00.000Z");
    await useCase.execute({ now });

    const range = vi.mocked(repository.findTodaySummary).mock.calls[0][0];
    expect(range.start.toISOString()).toBe("2026-08-08T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-09T21:00:00.000Z");
  });

  it("uses the provided date for the day range when present", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findTodaySummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 0,
      totalSales: null,
    });

    await useCase.execute({ date: "2026-08-01" });

    const range = vi.mocked(repository.findTodaySummary).mock.calls[0][0];
    expect(range.start.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-01T21:00:00.000Z");
  });
});
