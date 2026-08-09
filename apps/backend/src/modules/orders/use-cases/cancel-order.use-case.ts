import { OrderStatus, PaymentStatus } from "@restaurant/database";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  cancelOrderSchema,
  type CancelOrderDTO,
} from "../schemas/cancel-order.schema.js";
import {
  OrderNotFoundError,
  toOrderDTO,
  type OrderDTO,
} from "./get-order.use-case.js";
import { CANCELLABLE_ORDER_STATUSES } from "./update-order-status.use-case.js";

export class OrderAlreadyCancelledError extends Error {
  constructor() {
    super("Order is already cancelled");
    this.name = "OrderAlreadyCancelledError";
  }
}

export class OrderCannotBeCancelledError extends Error {
  constructor(status: OrderStatus) {
    super(`Order in status ${status} cannot be cancelled`);
    this.name = "OrderCannotBeCancelledError";
  }
}

export class PaidOrderCannotBeCancelledError extends Error {
  constructor() {
    super("Paid orders cannot be cancelled");
    this.name = "PaidOrderCannotBeCancelledError";
  }
}

export interface CancelOrderParams {
  orderId: string;
  input: CancelOrderDTO;
}

export class CancelOrderUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(params: CancelOrderParams): Promise<OrderDTO> {
    const data = cancelOrderSchema.parse(params.input);

    const order = await this.orderRepository.findById(params.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new OrderAlreadyCancelledError();
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new PaidOrderCannotBeCancelledError();
    }

    if (!CANCELLABLE_ORDER_STATUSES.includes(order.status)) {
      throw new OrderCannotBeCancelledError(order.status);
    }

    const cancelled =
      await this.orderRepository.cancelOrderAndReleaseTableIfUnoccupied({
        orderId: order.id,
        cancelledReason: data.reason ?? null,
      });

    return toOrderDTO(cancelled);
  }
}
