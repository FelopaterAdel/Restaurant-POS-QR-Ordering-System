import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import { GetOrderHistoryUseCase } from "../use-cases/get-order-history.use-case.js";
import { buildOrderHistory } from "./order.fixture.js";

function createMockRepository(
  overrides: Partial<OrderRepository> = {},
): OrderRepository {
  return {
    findTableById: vi.fn(),
    findProductsByIds: vi.fn(),
    createWithItems: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    findQueuePage: vi.fn(),
    findHistoryPage: vi.fn(),
    updateStatus: vi.fn(),
    completeOrderAndReleaseTable: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("GetOrderHistoryUseCase", () => {
  it("returns past orders with payment summary and pagination metadata", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderHistoryUseCase(repository);

    const orders = [
      buildOrderHistory({
        id: "order_102",
        orderNumber: 1042,
        status: OrderStatus.COMPLETED,
        table: { number: 5 },
        payments: [{ status: PaymentStatus.PAID, method: PaymentMethod.CASH }],
      }),
      buildOrderHistory({
        id: "order_101",
        orderNumber: 1041,
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-08-08T10:00:00.000Z"),
        table: { number: 3 },
        payments: [{ status: PaymentStatus.PAID, method: PaymentMethod.CARD }],
      }),
    ];

    vi.mocked(repository.findHistoryPage).mockResolvedValueOnce({
      items: orders,
      total: 87,
    });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(repository.findHistoryPage).toHaveBeenCalledWith({
      orderNumber: undefined,
      status: undefined,
      createdAt: undefined,
      page: 1,
      limit: 20,
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      id: "order_102",
      orderNumber: 1042,
      table: { number: 5 },
      status: OrderStatus.COMPLETED,
      totalAmount: 450,
      createdAt: new Date("2026-08-09T10:00:00.000Z"),
      payment: {
        status: PaymentStatus.PAID,
        method: PaymentMethod.CASH,
      },
    });
    expect(result.data[1].orderNumber).toBe(1041);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 87,
      totalPages: 5,
    });
  });

  it("filters by orderNumber, status and date", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderHistoryUseCase(repository);

    vi.mocked(repository.findHistoryPage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const result = await useCase.execute({
      orderNumber: 1042,
      status: OrderStatus.COMPLETED,
      date: "2026-08-09",
    });

    expect(repository.findHistoryPage).toHaveBeenCalledWith({
      orderNumber: 1042,
      status: OrderStatus.COMPLETED,
      createdAt: {
        gte: new Date("2026-08-09T00:00:00.000Z"),
        lt: new Date("2026-08-10T00:00:00.000Z"),
      },
      page: 1,
      limit: 20,
    });
    expect(result.data).toEqual([]);
  });

  it("falls back to the order paymentStatus when there is no payment record", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderHistoryUseCase(repository);

    vi.mocked(repository.findHistoryPage).mockResolvedValueOnce({
      items: [
        buildOrderHistory({
          paymentStatus: PaymentStatus.PENDING,
          payments: [],
        }),
      ],
      total: 1,
    });

    const result = await useCase.execute({});

    expect(result.data[0].payment).toEqual({
      status: PaymentStatus.PENDING,
      method: null,
    });
  });

  it("defaults to page 1 and limit 20 when not provided", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderHistoryUseCase(repository);

    vi.mocked(repository.findHistoryPage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    await useCase.execute({});

    expect(repository.findHistoryPage).toHaveBeenCalledWith({
      orderNumber: undefined,
      status: undefined,
      createdAt: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("returns an empty history when there are no matching orders", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderHistoryUseCase(repository);

    vi.mocked(repository.findHistoryPage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const result = await useCase.execute({});

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});
