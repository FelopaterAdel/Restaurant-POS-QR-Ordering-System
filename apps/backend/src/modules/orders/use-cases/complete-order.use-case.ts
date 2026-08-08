import { OrderStatus, PaymentStatus } from "@restaurant/database";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  OrderNotFoundError,
  toOrderDTO,
  type OrderDTO,
} from "./get-order.use-case.js";

export class OrderNotPaidError extends Error {
  constructor() {
    super("Order must be paid before completion");
    this.name = "OrderNotPaidError";
  }
}

export class OrderCannotBeCompletedError extends Error {
  constructor() {
    super("Order cannot be completed");
    this.name = "OrderCannotBeCompletedError";
  }
}

export class OrderAlreadyCompletedError extends Error {
  constructor() {
    super("Order is already completed");
    this.name = "OrderAlreadyCompletedError";
  }
}

export interface CompleteOrderParams {
  orderId: string;
}

export class CompleteOrderUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(params: CompleteOrderParams): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(params.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new OrderCannotBeCompletedError();
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new OrderAlreadyCompletedError();
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new OrderNotPaidError();
    }

    const completed = await this.orderRepository.completeOrderAndReleaseTable({
      orderId: order.id,
      tableId: order.tableId,
    });

    return toOrderDTO(completed);
  }
}
