import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { buildOrder, buildUser } from "../../orders/tests/order.fixture.js";
import { OrderNotFoundError } from "../../orders/use-cases/get-order.use-case.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import {
  OrderNotPayableError,
  PayOrderUseCase,
  PaymentAlreadyExistsError,
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
    createPaidPaymentAndUpdateOrder: vi.fn(),
    ...overrides,
  } as unknown as PaymentRepository;
}

describe("PayOrderUseCase", () => {
  it("records a PAID payment using the order total as the amount", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);
    const order = buildOrder({ totalAmount: new Prisma.Decimal(330) });

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(order);
    vi.mocked(
      paymentRepository.createPaidPaymentAndUpdateOrder,
    ).mockResolvedValueOnce(buildPayment({ amount: new Prisma.Decimal(330) }));

    const result = await useCase.execute({
      orderId: "order_1",
      input: { method: PaymentMethod.CASH },
    });

    const call = vi.mocked(paymentRepository.createPaidPaymentAndUpdateOrder)
      .mock.calls[0][0];
    expect(call.orderId).toBe("order_1");
    expect(call.method).toBe(PaymentMethod.CASH);
    expect(call.amount.toNumber()).toBe(330);
    expect(call.paidAt).toBeInstanceOf(Date);

    expect(result.status).toBe(PaymentStatus.PAID);
    expect(result.amount).toBe(330);
    expect(result.method).toBe(PaymentMethod.CASH);
    expect(result.orderId).toBe("order_1");
  });

  it("ignores a client-provided amount and uses the order total", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(buildOrder());
    vi.mocked(
      paymentRepository.createPaidPaymentAndUpdateOrder,
    ).mockResolvedValueOnce(buildPayment());

    await useCase.execute({
      orderId: "order_1",
      input: { method: PaymentMethod.CASH, amount: 10 } as never,
    });

    const call = vi.mocked(paymentRepository.createPaidPaymentAndUpdateOrder)
      .mock.calls[0][0];
    expect(call.amount.toNumber()).toBe(300);
  });

  it("records a card payment when CARD is provided", async () => {
    const orderRepository = createMockOrderRepository();
    const paymentRepository = createMockPaymentRepository();
    const useCase = new PayOrderUseCase(orderRepository, paymentRepository);

    vi.mocked(orderRepository.findById).mockResolvedValueOnce(buildOrder());
    vi.mocked(
      paymentRepository.createPaidPaymentAndUpdateOrder,
    ).mockResolvedValueOnce(buildPayment({ method: PaymentMethod.CARD }));

    const result = await useCase.execute({
      orderId: "order_1",
      input: { method: PaymentMethod.CARD },
    });

    expect(result.method).toBe(PaymentMethod.CARD);
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
    expect(
      paymentRepository.createPaidPaymentAndUpdateOrder,
    ).not.toHaveBeenCalled();
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
    expect(
      paymentRepository.createPaidPaymentAndUpdateOrder,
    ).not.toHaveBeenCalled();
  });

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
    expect(
      paymentRepository.createPaidPaymentAndUpdateOrder,
    ).not.toHaveBeenCalled();
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
    expect(
      paymentRepository.createPaidPaymentAndUpdateOrder,
    ).not.toHaveBeenCalled();
  });
});
