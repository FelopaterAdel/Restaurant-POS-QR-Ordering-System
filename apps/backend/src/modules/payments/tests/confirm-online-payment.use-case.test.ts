import { PaymentStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { buildOrder } from "../../orders/tests/order.fixture.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { ConfirmOnlinePaymentUseCase } from "../use-cases/confirm-online-payment.use-case.js";
import { buildPayment } from "./payment.fixture.js";

vi.mock("../../notifications/services/notification.service.js", () => ({
  createNotificationForRoles: vi.fn(async () => undefined),
}));

function setup() {
  const orderRepository = {
    findById: vi.fn(),
  } as unknown as OrderRepository;
  const paymentRepository = {
    findByProviderRef: vi.fn(),
    confirmOnlinePayment: vi.fn(),
  } as unknown as PaymentRepository;
  const useCase = new ConfirmOnlinePaymentUseCase(
    orderRepository,
    paymentRepository,
  );
  return { orderRepository, paymentRepository, useCase };
}

describe("ConfirmOnlinePaymentUseCase", () => {
  it("marks a pending online payment and its order as paid", async () => {
    const { orderRepository, paymentRepository, useCase } = setup();
    const pending = buildPayment({
      status: PaymentStatus.PENDING,
      provider: "stripe",
      providerRef: "pi_test_123",
      paidAt: null,
    });

    vi.mocked(paymentRepository.findByProviderRef).mockResolvedValueOnce(
      pending as never,
    );
    vi.mocked(orderRepository.findById).mockResolvedValueOnce(
      buildOrder({ paymentStatus: PaymentStatus.PENDING }) as never,
    );
    vi.mocked(paymentRepository.confirmOnlinePayment).mockResolvedValueOnce({
      ...pending,
      status: PaymentStatus.PAID,
    } as never);

    const result = await useCase.execute("pi_test_123");

    expect(result.outcome).toBe("paid");
    expect(result.paymentId).toBe("pay_1");
    expect(paymentRepository.confirmOnlinePayment).toHaveBeenCalledWith(
      "pay_1",
      "order_1",
    );
  });

  it("ignores unknown provider references", async () => {
    const { paymentRepository, useCase } = setup();

    vi.mocked(paymentRepository.findByProviderRef).mockResolvedValueOnce(
      null as never,
    );

    const result = await useCase.execute("pi_unknown");

    expect(result).toEqual({
      outcome: "ignored",
      paymentId: null,
      orderId: null,
    });
    expect(paymentRepository.confirmOnlinePayment).not.toHaveBeenCalled();
  });

  it("is idempotent for already-paid payments", async () => {
    const { paymentRepository, useCase } = setup();

    vi.mocked(paymentRepository.findByProviderRef).mockResolvedValueOnce(
      buildPayment({ providerRef: "pi_test_123" }) as never,
    );

    const result = await useCase.execute("pi_test_123");

    expect(result.outcome).toBe("already-paid");
    expect(paymentRepository.confirmOnlinePayment).not.toHaveBeenCalled();
  });
});
