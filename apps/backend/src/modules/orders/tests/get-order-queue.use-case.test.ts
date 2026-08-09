import { OrderStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import { GetOrderQueueUseCase } from "../use-cases/get-order-queue.use-case.js";
import { buildOrder } from "./order.fixture.js";

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
    updateStatus: vi.fn(),
    completeOrderAndReleaseTable: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("GetOrderQueueUseCase", () => {
  it("returns active orders with pagination metadata", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderQueueUseCase(repository);
    const orders = [
      buildOrder({
        id: "order_105",
        status: OrderStatus.PENDING,
        table: { number: 4 },
      }),
      buildOrder({
        id: "order_104",
        status: OrderStatus.PREPARING,
        table: { number: 2 },
      }),
    ];

    vi.mocked(repository.findQueuePage).mockResolvedValueOnce({
      items: orders,
      total: 45,
    });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(repository.findQueuePage).toHaveBeenCalledWith({
      statuses: [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ],
      page: 1,
      limit: 20,
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe("order_105");
    expect(result.data[0].tableNumber).toBe(4);
    expect(result.data[1].id).toBe("order_104");
    expect(result.data[1].status).toBe(OrderStatus.PREPARING);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("filters the queue by the given status", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderQueueUseCase(repository);

    vi.mocked(repository.findQueuePage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const result = await useCase.execute({ status: OrderStatus.READY });

    expect(repository.findQueuePage).toHaveBeenCalledWith({
      statuses: [OrderStatus.READY],
      page: 1,
      limit: 20,
    });
    expect(result.data).toEqual([]);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("defaults to page 1 and limit 20 when not provided", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderQueueUseCase(repository);

    vi.mocked(repository.findQueuePage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    await useCase.execute({});

    expect(repository.findQueuePage).toHaveBeenCalledWith({
      statuses: [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ],
      page: 1,
      limit: 20,
    });
  });

  it("returns an empty queue when there are no active orders", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderQueueUseCase(repository);

    vi.mocked(repository.findQueuePage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const result = await useCase.execute({});

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
