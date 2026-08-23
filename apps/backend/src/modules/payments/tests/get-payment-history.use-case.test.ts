import { PaymentMethod, PaymentStatus, Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import type { PaidPaymentWithOrder } from "../repositories/payment.repository.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import {
  GetPaymentHistoryUseCase,
  GetPaymentSummaryUseCase,
  resolvePaidAtRange,
} from "../use-cases/get-payment-history.use-case.js";

function createMockRepository(
  overrides: Partial<PaymentRepository> = {},
): PaymentRepository {
  return {
    findPaidPage: vi.fn(),
    summarizePaidPayments: vi.fn(),
    ...overrides,
  } as unknown as PaymentRepository;
}

function buildPaidPayment(
  overrides: Partial<PaidPaymentWithOrder> = {},
): PaidPaymentWithOrder {
  return {
    id: "pay_1",
    orderId: "order_1",
    amount: new Prisma.Decimal(480),
    method: PaymentMethod.CASH,
    status: PaymentStatus.PAID,
    paidAt: new Date("2026-08-23T09:30:00.000Z"),
    createdAt: new Date("2026-08-23T09:30:00.000Z"),
    order: {
      orderNumber: 1024,
      table: { number: 12 },
    },
    ...overrides,
  };
}

describe("resolvePaidAtRange", () => {
  it("resolves a single-day range to Cairo day boundaries", () => {
    const range = resolvePaidAtRange("2026-08-23", "2026-08-23");

    expect(range).toEqual({
      gte: new Date("2026-08-22T21:00:00.000Z"),
      lt: new Date("2026-08-23T21:00:00.000Z"),
    });
  });

  it("resolves a multi-day range inclusive of the last day", () => {
    const range = resolvePaidAtRange("2026-08-01", "2026-08-07");

    expect(range).toEqual({
      gte: new Date("2026-07-31T21:00:00.000Z"),
      lt: new Date("2026-08-07T21:00:00.000Z"),
    });
  });

  it("resolves standard-time boundaries when Cairo is on UTC+2", () => {
    const range = resolvePaidAtRange("2026-01-15");

    expect(range).toEqual({
      gte: new Date("2026-01-14T22:00:00.000Z"),
      lt: new Date("2026-01-15T22:00:00.000Z"),
    });
  });

  it("returns undefined when no dates are provided", () => {
    expect(resolvePaidAtRange()).toBeUndefined();
  });
});

describe("GetPaymentHistoryUseCase", () => {
  it("maps paid payments into DTOs with pagination metadata", async () => {
    const repository = createMockRepository();
    const useCase = new GetPaymentHistoryUseCase(repository);

    vi.mocked(repository.findPaidPage).mockResolvedValueOnce({
      items: [
        buildPaidPayment(),
        buildPaidPayment({
          id: "pay_2",
          orderId: "order_2",
          amount: new Prisma.Decimal(320),
          method: PaymentMethod.CARD,
          order: { orderNumber: 1023, table: { number: 8 } },
        }),
      ],
      total: 38,
    });

    const result = await useCase.execute({ page: 2, limit: 20 });

    expect(repository.findPaidPage).toHaveBeenCalledWith({
      paidAt: undefined,
      orderNumber: undefined,
      page: 2,
      limit: 20,
    });
    expect(result.data).toEqual([
      {
        id: "pay_1",
        orderNumber: 1024,
        tableNumber: 12,
        amount: 480,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        paidAt: new Date("2026-08-23T09:30:00.000Z"),
      },
      {
        id: "pay_2",
        orderNumber: 1023,
        tableNumber: 8,
        amount: 320,
        method: PaymentMethod.CARD,
        status: PaymentStatus.PAID,
        paidAt: new Date("2026-08-23T09:30:00.000Z"),
      },
    ]);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 38,
      totalPages: 2,
    });
  });

  it("defaults pagination to the first page with 20 items", async () => {
    const repository = createMockRepository();
    const useCase = new GetPaymentHistoryUseCase(repository);
    vi.mocked(repository.findPaidPage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const result = await useCase.execute();

    expect(repository.findPaidPage).toHaveBeenCalledWith({
      paidAt: undefined,
      orderNumber: undefined,
      page: 1,
      limit: 20,
    });
    expect(result.pagination.totalPages).toBe(0);
  });

  it("forwards date and order number filters as a Cairo paid-at range", async () => {
    const repository = createMockRepository();
    const useCase = new GetPaymentHistoryUseCase(repository);
    vi.mocked(repository.findPaidPage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    await useCase.execute({ from: "2026-08-23", to: "2026-08-23", orderNumber: 1024 });

    expect(repository.findPaidPage).toHaveBeenCalledWith({
      paidAt: {
        gte: new Date("2026-08-22T21:00:00.000Z"),
        lt: new Date("2026-08-23T21:00:00.000Z"),
      },
      orderNumber: 1024,
      page: 1,
      limit: 20,
    });
  });
});

describe("GetPaymentSummaryUseCase", () => {
  it("sums sales and counts payments from the repository", async () => {
    const repository = createMockRepository();
    const useCase = new GetPaymentSummaryUseCase(repository);

    vi.mocked(repository.summarizePaidPayments).mockResolvedValueOnce({
      totalSales: new Prisma.Decimal(12450.5),
      count: 38,
    });

    const result = await useCase.execute({ from: "2026-08-23" });

    expect(repository.summarizePaidPayments).toHaveBeenCalledWith({
      paidAt: {
        gte: new Date("2026-08-22T21:00:00.000Z"),
        lt: new Date("2026-08-23T21:00:00.000Z"),
      },
      orderNumber: undefined,
    });
    expect(result).toEqual({ totalSales: 12450.5, paidCount: 38 });
  });

  it("reports zero totals when there are no payments", async () => {
    const repository = createMockRepository();
    const useCase = new GetPaymentSummaryUseCase(repository);

    vi.mocked(repository.summarizePaidPayments).mockResolvedValueOnce({
      totalSales: null,
      count: 0,
    });

    const result = await useCase.execute();

    expect(result).toEqual({ totalSales: 0, paidCount: 0 });
  });
});
