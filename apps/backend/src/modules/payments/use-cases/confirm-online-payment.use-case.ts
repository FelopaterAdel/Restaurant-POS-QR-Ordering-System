import { PaymentStatus } from "@restaurant/database";
import { createNotificationForRoles } from "../../notifications/services/notification.service.js";
import { OrderNotFoundError } from "../../orders/use-cases/get-order.use-case.js";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { PaymentRepository } from "../repositories/payment.repository.js";

export interface ConfirmOnlinePaymentResult {
  outcome: "paid" | "already-paid" | "ignored";
  paymentId: string | null;
  orderId: string | null;
}

/**
 * Marks an online payment PAID from a provider webhook event.
 * Safe to receive the same event multiple times.
 */
export class ConfirmOnlinePaymentUseCase {
  private readonly orderRepository: OrderRepository;
  private readonly paymentRepository: PaymentRepository;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    paymentRepository: PaymentRepository = new PaymentRepository(),
  ) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(providerRef: string): Promise<ConfirmOnlinePaymentResult> {
    const payment =
      await this.paymentRepository.findByProviderRef(providerRef);
    if (!payment) {
      return { outcome: "ignored", paymentId: null, orderId: null };
    }

    if (payment.status === PaymentStatus.PAID) {
      return { outcome: "already-paid", paymentId: payment.id, orderId: payment.orderId };
    }

    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { outcome: "already-paid", paymentId: payment.id, orderId: payment.orderId };
    }

    const confirmed = await this.paymentRepository.confirmOnlinePayment(
      payment.id,
      order.id,
    );

    await createNotificationForRoles("PAYMENT_RECEIVED", {
      title: "Online Payment Received",
      message: `Order #${order.orderNumber}`,
      entityType: "PAYMENT",
      entityId: confirmed.id,
    });

    return { outcome: "paid", paymentId: confirmed.id, orderId: order.id };
  }
}
