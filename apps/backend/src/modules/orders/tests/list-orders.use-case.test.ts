import { OrderStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import { ListOrdersUseCase } from "../use-cases/list-orders.use-case.js";
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
    findOrdersPage: vi.fn(),
    updateStatus: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("ListOrdersUseCase", () => {
  it("returns paginated orders mapped to the DTO", async () => {
    const repository = createMockRepository();
    const useCase = new ListOrdersUseCase(repository);
    const orders = [
      buildOrder({
        id: "order_1",
        status: OrderStatus.PENDING,
        table: { number: 5 },
      }),
      buildOrder({
        id: "order_2",
        status: OrderStatus.SERVED,
        table: { number: 3 },
      }),
    ];

    vi.mocked(repository.findOrdersPage).mockResolvedValueOnce({
      items: orders,
      total: 2,
    });

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(repository.findOrdersPage).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe("order_1");
    expect(result.data[0].tableNumber).toBe(5);
    expect(result.data[1].id).toBe("order_2");
    expect(result.data[1].tableNumber).toBe(3);
    expect(result.data[1].status).toBe(OrderStatus.SERVED);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it("returns an empty list when there are no orders", async () => {
    const repository = createMockRepository();
    const useCase = new ListOrdersUseCase(repository);

    vi.mocked(repository.findOrdersPage).mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const result = await useCase.execute({});

    expect(result.data).toEqual([]);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });
});
