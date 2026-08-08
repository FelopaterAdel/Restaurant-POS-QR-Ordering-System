import { OrderStatus, PaymentStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  OrderAlreadyCompletedError,
  OrderCannotBeCompletedError,
  CompleteOrderUseCase,
  OrderNotPaidError,
} from "../use-cases/complete-order.use-case.js";
import { OrderNotFoundError } from "../use-cases/get-order.use-case.js";
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
    updateStatus: vi.fn(),
    completeOrderAndReleaseTable: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("CompleteOrderUseCase", () => {
  it("completes a paid order and releases the table", async () => {
    const repository = createMockRepository();
    const useCase = new CompleteOrderUseCase(repository);
    const order = buildOrder({
      status: OrderStatus.SERVED,
      paymentStatus: PaymentStatus.PAID,
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);
    vi.mocked(repository.completeOrderAndReleaseTable).mockResolvedValueOnce(
      buildOrder({
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
    );

    const result = await useCase.execute({ orderId: "order_1" });

    expect(repository.completeOrderAndReleaseTable).toHaveBeenCalledWith({
      orderId: "order_1",
      tableId: "table_1",
    });
    expect(result.status).toBe(OrderStatus.COMPLETED);
    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
  });

  it("throws OrderNotPaidError when the order has not been paid", async () => {
    const repository = createMockRepository();
    const useCase = new CompleteOrderUseCase(repository);
    const order = buildOrder({
      status: OrderStatus.SERVED,
      paymentStatus: PaymentStatus.PENDING,
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({ orderId: "order_1" }),
    ).rejects.toBeInstanceOf(OrderNotPaidError);
    expect(repository.completeOrderAndReleaseTable).not.toHaveBeenCalled();
  });

  it("throws OrderCannotBeCompletedError for a cancelled order", async () => {
    const repository = createMockRepository();
    const useCase = new CompleteOrderUseCase(repository);
    const order = buildOrder({ status: OrderStatus.CANCELLED });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({ orderId: "order_1" }),
    ).rejects.toBeInstanceOf(OrderCannotBeCompletedError);
    expect(repository.completeOrderAndReleaseTable).not.toHaveBeenCalled();
  });

  it("throws OrderAlreadyCompletedError when the order is already completed", async () => {
    const repository = createMockRepository();
    const useCase = new CompleteOrderUseCase(repository);
    const order = buildOrder({
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({ orderId: "order_1" }),
    ).rejects.toBeInstanceOf(OrderAlreadyCompletedError);
    expect(repository.completeOrderAndReleaseTable).not.toHaveBeenCalled();
  });

  it("throws OrderNotFoundError when the order does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new CompleteOrderUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ orderId: "order_missing" }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
    expect(repository.completeOrderAndReleaseTable).not.toHaveBeenCalled();
  });
});
