import { OrderStatus, PaymentStatus, Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  GetPublicOrderUseCase,
} from "../use-cases/get-public-order.use-case.js";
import { OrderNotFoundError } from "../use-cases/get-order.use-case.js";
import { buildOrder, buildOrderItem } from "./order.fixture.js";

function createMockRepository(
  overrides: Partial<OrderRepository> = {},
): OrderRepository {
  return {
    findTableById: vi.fn(),
    findProductsByIds: vi.fn(),
    createWithItems: vi.fn(),
    findById: vi.fn(),
    findPublicViewById: vi.fn(),
    findMany: vi.fn(),
    updateStatus: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("GetPublicOrderUseCase", () => {
  it("returns the order DTO when the qr code matches the order table", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicOrderUseCase(repository);
    const order = {
      ...buildOrder({
        status: OrderStatus.PREPARING,
        totalAmount: new Prisma.Decimal(330),
        items: [
          buildOrderItem({ product: { id: "prod_1", name: "Margherita Pizza" } }),
        ],
      }),
      table: { number: 5, qrCode: "tbl_abc123" },
    };

    vi.mocked(repository.findPublicViewById).mockResolvedValueOnce(order);

    const result = await useCase.execute(
      { orderId: "order_1" },
      { qrCode: "tbl_abc123" },
    );

    expect(repository.findPublicViewById).toHaveBeenCalledWith("order_1");
    expect(result).toEqual({
      id: "order_1",
      orderNumber: 1001,
      tableId: "table_1",
      tableNumber: 5,
      status: OrderStatus.PREPARING,
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
    const useCase = new GetPublicOrderUseCase(repository);

    vi.mocked(repository.findPublicViewById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ orderId: "order_missing" }, { qrCode: "tbl_abc123" }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it("throws OrderNotFoundError when the qr code belongs to another table", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicOrderUseCase(repository);
    const order = {
      ...buildOrder(),
      table: { number: 5, qrCode: "tbl_abc123" },
    };

    vi.mocked(repository.findPublicViewById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({ orderId: "order_1" }, { qrCode: "tbl_other" }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
    expect(repository.findPublicViewById).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing order id without touching the repository", async () => {
    const repository = createMockRepository();
    const useCase = new GetPublicOrderUseCase(repository);

    await expect(
      useCase.execute({ orderId: "" }, { qrCode: "tbl_abc123" }),
    ).rejects.toBeInstanceOf(Error);

    expect(repository.findPublicViewById).not.toHaveBeenCalled();
  });
});
