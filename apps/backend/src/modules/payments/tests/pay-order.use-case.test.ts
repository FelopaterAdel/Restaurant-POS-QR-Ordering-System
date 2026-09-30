import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { buildOrder } from "../../orders/tests/order.fixture.js";
import { OrderNotFoundError } from "../../orders/use-cases/get-order.use-case.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import {
  OrderNotPayableError,
  PayOrderUseCase,
  PaymentAlreadyExistsError,
  PaymentExceedsRemainingError,
} from "../use-cases/pay-order.use-case.js";
import { buildPayment } from "./payment.fixture.js";

function createMockOrderRepository(
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

function createMockPaymentRepository(
  overrides: Partial<PaymentRepository> = {},
): PaymentRepository {
  return {
    collectPayment: vi.fn(),
    ...overrides,
  } as unknown as PaymentRepository;
}

function collectedOk(overrides: Record<string, unknown> = {}) {
  return {
    ok: true as const,
    collected: {
      payment: buildPayment(),
      remaining: new Prisma.Decimal(0),
      orderPaid: true,
      ...overrides,
    },
  };
}

describe("PayOrderUseCase", () => {
  it("pays the full remaining balance by default", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);
    const order = buildOrder({
      status: OrderStatus.SERVED,
      totalAmount: new Prisma.Decimal(330),
    });

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(order);
    vi.mocked(paymentRepository.collectPayment).mockResolvedValueOnce(
      collectedOk({
        payment: buildPayment({ amount: new Prisma.Decimal(330) }),
      }),
    );
    // Second findById for the notification.
    vi.mocked(orderRepository.findById).mockResolvedValueOnce(order);

    const result = await useCase.execute({
      orderId: "order_1",
      input: { method: PaymentMethod.CASH },
    });

    const call = vi.mocked(paymentRepository.collectPayment).mock.calls[0][0];
    expect(call.orderId).toBe("order_1");
    expect(call.method).toBe(PaymentMethod.CASH);
    expect(call.itemsAmount.toNumber()).toBe(330);
    expect(call.tipAmount.toNumber()).toBe(0);

    expect(result.status).toBe(PaymentStatus.PAID);
    expect(result.amount).toBe(330);
    expect(result.tipAmount).toBe(0);
    expect(result.orderPaid).toBe(true);
    expect(result.remainingAmount).toBe(0);
  });

  it("records a partial payment and reports the remainder", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValue(
      buildOrder({
        status: OrderStatus.SERVED,
        totalAmount: new Prisma.Decimal(300),
      }),
    );
    vi.mocked(paymentRepository.collectPayment).mockResolvedValueOnce(
      collectedOk({
        payment: buildPayment({ amount: new Prisma.Decimal(100) }),
        remaining: new Prisma.Decimal(200),
        orderPaid: false,
      }),
    );

    const result = await useCase.execute({
      orderId: "order_1",
      input: { method: PaymentMethod.CASH, amount: 100 },
    });

    const call = vi.mocked(paymentRepository.collectPayment).mock.calls[0][0];
    expect(call.itemsAmount.toNumber()).toBe(100);
    expect(result.orderPaid).toBe(false);
    expect(result.remainingAmount).toBe(200);
  });

  it("computes tips from a percent of the paid portion", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValue(
      buildOrder({
        status: OrderStatus.SERVED,
        totalAmount: new Prisma.Decimal(200),
      }),
    );
    vi.mocked(paymentRepository.collectPayment).mockResolvedValueOnce(
      collectedOk({
        payment: buildPayment({
          amount: new Prisma.Decimal(220),
          tipAmount: new Prisma.Decimal(20),
        }),
        remaining: new Prisma.Decimal(0),
        orderPaid: true,
      }),
    );

    const result = await useCase.execute({
      orderId: "order_1",
      input: { method: PaymentMethod.CARD, tipPercent: 10 },
    });

    const call = vi.mocked(paymentRepository.collectPayment).mock.calls[0][0];
    expect(call.itemsAmount.toNumber()).toBe(200);
    expect(call.tipAmount.toNumber()).toBe(20);
    expect(result.amount).toBe(220);
    expect(result.tipAmount).toBe(20);
  });

  it("maps an exhausted balance to PaymentAlreadyExistsError", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({ status: OrderStatus.READY }),
    );
    vi.mocked(paymentRepository.collectPayment).mockResolvedValueOnce({
      ok: false,
      reason: "already-paid",
      remaining: new Prisma.Decimal(0),
    });

    await expect(
      useCase.execute({
        orderId: "order_1",
        input: { method: PaymentMethod.CASH },
      }),
    ).rejects.toBeInstanceOf(PaymentAlreadyExistsError);
  });

  it("maps an overpayment to PaymentExceedsRemainingError", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({ status: OrderStatus.READY }),
    );
    vi.mocked(paymentRepository.collectPayment).mockResolvedValueOnce({
      ok: false,
      reason: "exceeds-remaining",
      remaining: new Prisma.Decimal(50),
    });

    await expect(
      useCase.execute({
        orderId: "order_1",
        input: { method: PaymentMethod.CASH, amount: 100 },
      }),
    ).rejects.toBeInstanceOf(PaymentExceedsRemainingError);
  });

  it("throws PaymentAlreadyExistsError when the order is already paid", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({ paymentStatus: PaymentStatus.PAID }),
    );

    await expect(
      useCase.execute({
        orderId: "order_1",
        input: { method: PaymentMethod.CASH },
      }),
    ).rejects.toBeInstanceOf(PaymentAlreadyExistsError);
    expect(paymentRepository.collectPayment).not.toHaveBeenCalled();
  });

  it("throws OrderNotPayableError when the order is cancelled", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({ status: OrderStatus.CANCELLED }),
    );

    await expect(
      useCase.execute({
        orderId: "order_1",
        input: { method: PaymentMethod.CASH },
      }),
    ).rejects.toBeInstanceOf(OrderNotPayableError);
    expect(paymentRepository.collectPayment).not.toHaveBeenCalled();
  });

  it.each([
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
  ])("throws OrderNotPayableError for a %s order", async (status) => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({ status }),
    );

    await expect(
      useCase.execute({
        orderId: "order_1",
        input: { method: PaymentMethod.CASH },
      }),
    ).rejects.toBeInstanceOf(OrderNotPayableError);
    expect(paymentRepository.collectPayment).not.toHaveBeenCalled();
  });

  it.each([OrderStatus.READY, OrderStatus.SERVED])(
    "records a payment for a %s order",
    async (status) => {
      const orderRepository = createMockOrderRepository();
      const paymentRepository = createMockPaymentRepository();
      const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

      vi.mocked(orderRepository.findById).mockResolvedValue(
        buildOrder({ status }),
      );
      vi.mocked(paymentRepository.collectPayment).mockResolvedValue(
        collectedOk(),
      );

      const result = await useCase.execute({
        orderId: "order_1",
        input: { method: PaymentMethod.CASH },
      });

      expect(paymentRepository.collectPayment).toHaveBeenCalled();
      expect(result.status).toBe(PaymentStatus.PAID);
    },
  );

  it("throws OrderNotFoundError when the order does not exist", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        orderId: "order_missing",
        input: { method: PaymentMethod.CASH },
      }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
    expect(paymentRepository.collectPayment).not.toHaveBeenCalled();
  });

  it("rejects an unknown payment method", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(buildOrder());

    await expect(
      useCase.execute({
        orderId: "order_1",
        input: { method: "BITCOIN" as PaymentMethod },
      }),
    ).rejects.toThrow();
    expect(paymentRepository.collectPayment).not.toHaveBeenCalled();
  });

  it("rejects both tipAmount and tipPercent together", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    await expect(
      useCase.execute({
        orderId: "order_1",
        input: { method: PaymentMethod.CASH, tipAmount: 5, tipPercent: 10 },
      }),
    ).rejects.toThrow();
    expect(paymentRepository.collectPayment).not.toHaveBeenCalled();
  });
});
