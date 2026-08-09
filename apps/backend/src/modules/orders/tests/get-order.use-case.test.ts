import { OrderStatus, PaymentStatus, Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  GetOrderUseCase,
  OrderNotFoundError,
} from "../use-cases/get-order.use-case.js";
import { buildOrder, buildOrderItem } from "./order.fixture.js";

function createMockRepository(
  overrides: Partial<OrderRepository> = {},
): OrderRepository {
  return {
    findTableById: vi.fn(),
    findProductsByIds: vi.fn(),
    createWithItems: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    updateStatus: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("GetOrderUseCase", () => {
  it("returns an order mapped to the DTO", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderUseCase(repository);
    const order = buildOrder({
      status: OrderStatus.CONFIRMED,
      totalAmount: new Prisma.Decimal(330),
      items: [
        buildOrderItem({ product: { id: "prod_1", name: "Margherita Pizza" } }),
      ],
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute("order_1");

    expect(repository.findById).toHaveBeenCalledWith("order_1");
    expect(result).toEqual({
      id: "order_1",
      orderNumber: 1001,
      tableId: "table_1",
      tableNumber: 5,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: 330,
      cancelledAt: null,
      cancelledReason: null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: [
        {
          id: "item_1",
          productId: "prod_1",
          productName: "Margherita Pizza",
          quantity: 2,
          unitPrice: 150,
          totalPrice: 300,
        },
      ],
    });
  });

  it("throws OrderNotFoundError when the order does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new GetOrderUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("order_missing")).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });
});
