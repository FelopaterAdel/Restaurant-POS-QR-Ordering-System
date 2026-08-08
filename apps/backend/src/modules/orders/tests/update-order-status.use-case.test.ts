import { OrderStatus, UserRole } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  ForbiddenStatusTransitionError,
  InvalidStatusTransitionError,
  UpdateOrderStatusUseCase,
} from "../use-cases/update-order-status.use-case.js";
import { OrderNotFoundError } from "../use-cases/get-order.use-case.js";
import { buildOrder, buildUser } from "./order.fixture.js";

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

function setupStatusWalk(repository: OrderRepository) {
  let current = buildOrder({ status: OrderStatus.PENDING });

  vi.mocked(repository.findById).mockImplementation(async () => current);
  vi.mocked(repository.updateStatus).mockImplementation(async (_id, status) => {
    current = buildOrder({
      status,
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    return current;
  });

  return {
    getCurrent: () => current,
  };
}

describe("UpdateOrderStatusUseCase", () => {
  it("walks the full lifecycle PENDING → SERVED as an owner", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const owner = buildUser();
    setupStatusWalk(repository);

    const steps = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.SERVED,
    ];

    for (const next of steps) {
      const result = await useCase.execute({
        orderId: "order_1",
        user: owner,
        input: { status: next },
      });
      expect(result.status).toBe(next);
    }

    expect(repository.findById).toHaveBeenCalledTimes(4);
    expect(repository.updateStatus).toHaveBeenCalledTimes(4);
  });

  it("lets a kitchen user advance PENDING → CONFIRMED → PREPARING → READY", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const kitchen = buildUser({ role: UserRole.KITCHEN });
    setupStatusWalk(repository);

    for (const next of [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ]) {
      const result = await useCase.execute({
        orderId: "order_1",
        user: kitchen,
        input: { status: next },
      });
      expect(result.status).toBe(next);
    }
  });

  it("forbids a kitchen user from serving an order", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const kitchen = buildUser({ role: UserRole.KITCHEN });
    const order = buildOrder({ status: OrderStatus.READY });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({
        orderId: "order_1",
        user: kitchen,
        input: { status: OrderStatus.SERVED },
      }),
    ).rejects.toBeInstanceOf(ForbiddenStatusTransitionError);
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("forbids a kitchen user from cancelling an order", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const kitchen = buildUser({ role: UserRole.KITCHEN });
    const order = buildOrder({ status: OrderStatus.PENDING });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({
        orderId: "order_1",
        user: kitchen,
        input: { status: OrderStatus.CANCELLED },
      }),
    ).rejects.toBeInstanceOf(ForbiddenStatusTransitionError);
  });

  it("lets a waiter serve a ready order", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const waiter = buildUser({ role: UserRole.WAITER });
    const order = buildOrder({ status: OrderStatus.READY });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);
    vi.mocked(repository.updateStatus).mockResolvedValueOnce(
      buildOrder({ status: OrderStatus.SERVED }),
    );

    const result = await useCase.execute({
      orderId: "order_1",
      user: waiter,
      input: { status: OrderStatus.SERVED },
    });

    expect(result.status).toBe(OrderStatus.SERVED);
  });

  it("forbids a waiter from advancing an order to READY", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const waiter = buildUser({ role: UserRole.WAITER });
    const order = buildOrder({ status: OrderStatus.PREPARING });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({
        orderId: "order_1",
        user: waiter,
        input: { status: OrderStatus.READY },
      }),
    ).rejects.toBeInstanceOf(ForbiddenStatusTransitionError);
  });

  it("lets owner and manager cancel a pending order", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);

    for (const role of [UserRole.OWNER, UserRole.MANAGER]) {
      const order = buildOrder({ status: OrderStatus.PENDING });
      vi.mocked(repository.findById).mockResolvedValueOnce(order);
      vi.mocked(repository.updateStatus).mockResolvedValueOnce(
        buildOrder({ status: OrderStatus.CANCELLED }),
      );

      const result = await useCase.execute({
        orderId: "order_1",
        user: buildUser({ role }),
        input: { status: OrderStatus.CANCELLED },
      });

      expect(result.status).toBe(OrderStatus.CANCELLED);
    }
  });

  it("forbids a cashier from changing any status", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const cashier = buildUser({ role: UserRole.CASHIER });
    const order = buildOrder({ status: OrderStatus.PENDING });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({
        orderId: "order_1",
        user: cashier,
        input: { status: OrderStatus.CONFIRMED },
      }),
    ).rejects.toBeInstanceOf(ForbiddenStatusTransitionError);
  });

  it("rejects invalid transitions even for an owner", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const owner = buildUser();

    const cases: Array<[OrderStatus, OrderStatus]> = [
      [OrderStatus.PENDING, OrderStatus.READY],
      [OrderStatus.PENDING, OrderStatus.SERVED],
      [OrderStatus.SERVED, OrderStatus.PREPARING],
      [OrderStatus.CANCELLED, OrderStatus.PREPARING],
      [OrderStatus.PENDING, OrderStatus.PENDING],
    ];

    for (const [from, to] of cases) {
      vi.mocked(repository.findById).mockResolvedValueOnce(
        buildOrder({ status: from }),
      );

      await expect(
        useCase.execute({
          orderId: "order_1",
          user: owner,
          input: { status: to },
        }),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    }

    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects a transition from a cancelled order", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);
    const owner = buildUser();
    const order = buildOrder({ status: OrderStatus.CANCELLED });

    vi.mocked(repository.findById).mockResolvedValueOnce(order);

    await expect(
      useCase.execute({
        orderId: "order_1",
        user: owner,
        input: { status: OrderStatus.PENDING },
      }),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
  });

  it("throws OrderNotFoundError when the order does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        orderId: "order_missing",
        user: buildUser(),
        input: { status: OrderStatus.CONFIRMED },
      }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it("rejects an unknown status value", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateOrderStatusUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(buildOrder());

    await expect(
      useCase.execute({
        orderId: "order_1",
        user: buildUser(),
        input: { status: "INVALID" as OrderStatus },
      }),
    ).rejects.toThrow();
  });
});
