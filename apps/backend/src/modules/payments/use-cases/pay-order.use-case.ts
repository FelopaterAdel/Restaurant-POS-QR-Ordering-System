import { OrderStatus, PaymentStatus, Prisma } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { OrderNotFoundError } from "../../orders/use-cases/get-order.use-case.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import {
  createPaymentSchema,
  type CreatePaymentDTO,
} from "../schemas/create-payment.schema.js";
import { createNotificationForRoles } from "../../notifications/services/notification.service.js";

const PAYABLE_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.READY,
  OrderStatus.SERVED,
];

export class OrderNotPayableError extends ConflictError {
  constructor(status: OrderStatus) {
    super(
      AppErrorCode.PAYMENT_NOT_ALLOWED,
      `Order in status ${status} cannot be paid`,
    );
    this.name = "OrderNotPayableError";
  }
}

export class PaymentAlreadyExistsError extends ConflictError {
  constructor() {
    super(AppErrorCode.PAYMENT_ALREADY_EXISTS, "Order is already paid");
    this.name = "PaymentAlreadyExistsError";
  }
}

export class PaymentExceedsRemainingError extends ConflictError {
  constructor(remaining: number) {
    super(
      AppErrorCode.PAYMENT_EXCEEDS_REMAINING,
      `Amount exceeds the remaining balance of ${remaining}`,
    );
    this.name = "PaymentExceedsRemainingError";
  }
}

export interface PaymentDTO {
  id: string;
  orderId: string;
  amount: number;
  tipAmount: number;
  method: CreatePaymentDTO["method"];
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
  remainingAmount: number;
  orderPaid: boolean;
}

export interface PayOrderParams {
  orderId: string;
  input: CreatePaymentDTO;
}

export class PayOrderUseCase {
  private readonly orderRepository: OrderRepository;
  private readonly paymentRepository: PaymentRepository;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    paymentRepository: PaymentRepository = new PaymentRepository(),
  ) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(params: PayOrderParams): Promise<PaymentDTO> {
    const data = createPaymentSchema.parse(params.input);

    const order = await this.orderRepository.findById(params.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new PaymentAlreadyExistsError();
    }

    if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
      throw new OrderNotPayableError(order.status);
    }

    const itemsAmount =
      data.amount !== undefined
        ? new Prisma.Decimal(data.amount)
        : new Prisma.Decimal(order.totalAmount);
    const tipAmount =
      data.tipAmount !== undefined
        ? new Prisma.Decimal(data.tipAmount)
        : data.tipPercent !== undefined
          ? itemsAmount
              .mul(data.tipPercent)
              .div(100)
              .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
          : new Prisma.Decimal(0);

    const result = await this.paymentRepository.collectPayment({
      orderId: order.id,
      itemsAmount,
      tipAmount,
      method: data.method,
      paidAt: new Date(),
    });

    if (!result.ok) {
      if (result.reason === "already-paid") {
        throw new PaymentAlreadyExistsError();
      }
      if (result.reason === "order-missing") {
        throw new OrderNotFoundError();
      }
      throw new PaymentExceedsRemainingError(Number(result.remaining));
    }

    const { payment, remaining, orderPaid } = result.collected;

    const paidOrder = await this.orderRepository.findById(payment.orderId);
    await createNotificationForRoles("PAYMENT_RECEIVED", {
      title: "Payment Received",
      message: `Order #${paidOrder?.orderNumber ?? ""}`,
      entityType: "PAYMENT",
      entityId: payment.id,
    });

    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      tipAmount: Number(payment.tipAmount),
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      remainingAmount: Number(remaining),
      orderPaid,
    };
  }
}
