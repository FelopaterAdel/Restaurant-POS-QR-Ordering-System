import { OrderStatus, Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import {
  DashboardRepository,
  type PaidPaymentRow,
} from "../repositories/dashboard.repository.js";
import {
  GetDashboardSummaryUseCase,
  getDateRangeInTimeZone,
} from "../use-cases/get-dashboard-summary.use-case.js";
import { RESTAURANT_TIMEZONE } from "../../../config/restaurant.js";

function createMockRepository(
  overrides: Partial<DashboardRepository> = {},
): DashboardRepository {
  return {
    findSummary: vi.fn(),
    ...overrides,
  } as unknown as DashboardRepository;
}

function paidPayment(paidAt: string, amount: number): PaidPaymentRow {
  return {
    paidAt: new Date(paidAt),
    amount: new Prisma.Decimal(amount),
  };
}

describe("GetDashboardSummaryUseCase", () => {
  it("builds the summary with per-status order counts and sales from the repository", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findSummary).mockResolvedValueOnce({
      orderCountsByStatus: [
        { status: OrderStatus.PENDING, count: 2 },
        { status: OrderStatus.PREPARING, count: 5 },
        { status: OrderStatus.READY, count: 3 },
        { status: OrderStatus.COMPLETED, count: 22 },
        { status: OrderStatus.CANCELLED, count: 3 },
      ],
      paidOrdersCount: 22,
      totalSales: new Prisma.Decimal(4250),
      paidPayments: [],
    });

    const result = await useCase.execute();

    expect(repository.findSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      }),
    );
    expect(result.orders).toEqual({
      total: 35,
      pending: 2,
      confirmed: 0,
      preparing: 5,
      ready: 3,
      served: 0,
      completed: 22,
      cancelled: 3,
    });
    expect(result.payments).toEqual({
      paidOrders: 22,
      totalSales: 4250,
    });
    expect(result.sales.granularity).toBe("hourly");
    expect(result.sales.points).toHaveLength(24);
  });

  it("defaults every status count and the sales total to zero when there is no data", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findSummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 0,
      totalSales: null,
      paidPayments: [],
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
    expect(result.sales.points.every((point) => point.amount === 0)).toBe(true);
  });

  it("uses today's range in the restaurant timezone when no date is provided", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findSummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 0,
      totalSales: null,
      paidPayments: [],
    });

    const now = new Date("2026-08-09T18:30:00.000Z");
    await useCase.execute({ now });

    const range = vi.mocked(repository.findSummary).mock.calls[0][0];
    expect(range.start.toISOString()).toBe("2026-08-08T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-09T21:00:00.000Z");
  });

  it("uses the provided date for the day range when present", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findSummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 0,
      totalSales: null,
      paidPayments: [],
    });

    await useCase.execute({ date: "2026-08-01" });

    const range = vi.mocked(repository.findSummary).mock.calls[0][0];
    expect(range.start.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-01T21:00:00.000Z");
  });

  it("uses a multi-day range when from and to are provided", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findSummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 0,
      totalSales: null,
      paidPayments: [],
    });

    await useCase.execute({ from: "2026-08-17", to: "2026-08-23" });

    const range = vi.mocked(repository.findSummary).mock.calls[0][0];
    expect(range.start.toISOString()).toBe("2026-08-16T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-23T21:00:00.000Z");
  });

  it("buckets single-day payments into hourly points in the restaurant timezone", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findSummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 2,
      totalSales: new Prisma.Decimal(350),
      paidPayments: [
        // 01:30 Cairo (UTC+3) on 2026-08-09 => 22:30 UTC on 2026-08-08
        paidPayment("2026-08-08T22:30:00.000Z", 200),
        // 14:00 Cairo => 11:00 UTC
        paidPayment("2026-08-09T11:00:00.000Z", 150),
      ],
    });

    const result = await useCase.execute({ date: "2026-08-09" });

    expect(result.sales.granularity).toBe("hourly");
    expect(result.sales.points).toHaveLength(24);
    expect(result.sales.points[1]).toEqual({ key: "01", amount: 200 });
    expect(result.sales.points[14]).toEqual({ key: "14", amount: 150 });
    expect(
      result.sales.points
        .filter((point) => !["01", "14"].includes(point.key))
        .every((point) => point.amount === 0),
    ).toBe(true);
  });

  it("buckets multi-day payments into daily points", async () => {
    const repository = createMockRepository();
    const useCase = new GetDashboardSummaryUseCase(repository);

    vi.mocked(repository.findSummary).mockResolvedValueOnce({
      orderCountsByStatus: [],
      paidOrdersCount: 3,
      totalSales: new Prisma.Decimal(600),
      paidPayments: [
        paidPayment("2026-08-17T10:00:00.000Z", 250),
        paidPayment("2026-08-19T20:00:00.000Z", 150),
        // 23:30 Cairo on 2026-08-19 falls on the same local day
        paidPayment("2026-08-19T20:30:00.000Z", 200),
      ],
    });

    const result = await useCase.execute({ from: "2026-08-17", to: "2026-08-23" });

    expect(result.sales.granularity).toBe("daily");
    expect(result.sales.points).toHaveLength(7);
    expect(result.sales.points[0]).toEqual({ key: "2026-08-17", amount: 250 });
    expect(result.sales.points[2]).toEqual({ key: "2026-08-19", amount: 350 });
    expect(result.sales.points[4]).toEqual({ key: "2026-08-21", amount: 0 });
  });
});

describe("getDateRangeInTimeZone", () => {
  it("covers whole local days across daylight saving boundaries", () => {
    const range = getDateRangeInTimeZone(
      "2026-10-28",
      "2026-10-31",
      RESTAURANT_TIMEZONE,
    );

    expect(range.start.toISOString()).toBe("2026-10-27T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-31T22:00:00.000Z");
  });
});
