import { OrderStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  OrderAlreadyCancelledError,
  OrderCannotBeCancelledError,
  CancelOrderUseCase,
} from "../use-cases/cancel-order.use-case.js";
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
    findQueuePage: vi.fn(),
    updateStatus: vi.fn(),
    cancelOrderAndReleaseTableIfUnoccupied: vi.fn(),
    completeOrderAndReleaseTable: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("CancelOrderUseCase", () => {
  it("cancels a pending order and stores the reason", async () => {
    const repository = createMockRepository();
    const useCase = new CancelOrderUseCase(repository);
    const order = buildOrder({ status: OrderStatus.PENDING });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);
    vi.mocked(
      repository.cancelOrderAndReleaseTableIfUnoccupied,
    ).mockResolvedValueOnce(
      buildOrder({
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date("2026-01-02T00:00:00.000Z"),
        cancelledReason: "Customer requested cancellation",
      }),
    );

    const result = await useCase.execute({
      orderId: "order_1",
      input: { reason: "Customer requested cancellation" },
    });

    expect(
      repository.cancelOrderAndReleaseTableIfUnoccupied,
    ).toHaveBeenCalledWith({
      orderId: "order_1",
      cancelledReason: "Customer requested cancellation",
    });
    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(result.cancelledReason).toBe("Customer requested cancellation");
    expect(result.cancelledAt).toEqual(new Date("2026-01-02T00:00:00.000Z"));
  });

  it("cancels a confirmed order", async () => {
    const repository = createMockRepository();
    const useCase = new CancelOrderUseCase(repository);
    const order = buildOrder({ status: OrderStatus.CONFIRMED });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);
    vi.mocked(
      repository.cancelOrderAndReleaseTableIfUnoccupied,
    ).mockResolvedValueOnce(
      buildOrder({
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
    );

    const result = await useCase.execute({ orderId: "order_1", input: {} });

    expect(
      repository.cancelOrderAndReleaseTableIfUnoccupied,
    ).toHaveBeenCalledWith({
      orderId: "order_1",
      cancelledReason: null,
    });
    expect(result.status).toBe(OrderStatus.CANCELLED);
  });

  it("throws OrderAlreadyCancelledError for an already cancelled order", async () => {
    const repository = createMockRepository();
    const useCase = new CancelOrderUseCase(repository);
    const order = buildOrder({
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({ orderId: "order_1", input: {} }),
    ).rejects.toBeInstanceOf(OrderAlreadyCancelledError);
    expect(
      repository.cancelOrderAndReleaseTableIfUnoccupied,
    ).not.toHaveBeenCalled();
  });

  it.each([
    [OrderStatus.PREPARING],
    [OrderStatus.READY],
    [OrderStatus.SERVED],
    [OrderStatus.COMPLETED],
  ])("throws OrderCannotBeCancelledError for a %s order", async (status) => {
    const repository = createMockRepository();
    const useCase = new CancelOrderUseCase(repository);
    const order = buildOrder({ status });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({ orderId: "order_1", input: {} }),
    ).rejects.toBeInstanceOf(OrderCannotBeCancelledError);
    expect(
      repository.cancelOrderAndReleaseTableIfUnoccupied,
    ).not.toHaveBeenCalled();
  });

  it("throws OrderNotFoundError when the order does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new CancelOrderUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ orderId: "order_missing", input: {} }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
    expect(
      repository.cancelOrderAndReleaseTableIfUnoccupied,
    ).not.toHaveBeenCalled();
  });
});
