import { OrderStatus, PaymentStatus } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
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

export class OrderAlreadyCancelledError extends ConflictError {
  constructor() {
    super(AppErrorCode.ORDER_ALREADY_CANCELLED, "Order is already cancelled");
    this.name = "OrderAlreadyCancelledError";
  }
}

export class OrderCannotBeCancelledError extends ConflictError {
  constructor(status: OrderStatus) {
    super(
      AppErrorCode.ORDER_CANNOT_BE_CANCELLED,
      `Order in status ${status} cannot be cancelled`,
    );
    this.name = "OrderCannotBeCancelledError";
  }
}

export class PaidOrderCannotBeCancelledError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.ORDER_CANNOT_BE_CANCELLED,
      "Paid orders cannot be cancelled",
    );
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
