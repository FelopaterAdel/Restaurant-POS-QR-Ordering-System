import { OrderStatus, PaymentStatus, Prisma } from "@restaurant/database";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { OrderNotFoundError } from "../../orders/use-cases/get-order.use-case.js";
import {
  PaymentRepository,
  type CreatePaidPaymentInput,
} from "../repositories/payment.repository.js";
import {
  createPaymentSchema,
  type CreatePaymentDTO,
} from "../schemas/create-payment.schema.js";

const PAYABLE_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.READY,
  OrderStatus.SERVED,
];

export class OrderNotPayableError extends Error {
  constructor(status: OrderStatus) {
    super(`Order in status ${status} cannot be paid`);
    this.name = "OrderNotPayableError";
  }
}

export class PaymentAlreadyExistsError extends Error {
  constructor() {
    super("Order is already paid");
    this.name = "PaymentAlreadyExistsError";
  }
}

export interface PaymentDTO {
  id: string;
  orderId: string;
  amount: number;
  method: CreatePaymentDTO["method"];
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
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

    const input: CreatePaidPaymentInput = {
      orderId: order.id,
      amount: order.totalAmount,
      method: data.method,
      paidAt: new Date(),
    };

    let payment;
    try {
      payment =
        await this.paymentRepository.createPaidPaymentAndUpdateOrder(input);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new PaymentAlreadyExistsError();
      }
      throw error;
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }
}
