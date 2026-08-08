import { OrderStatus, UserRole } from "@restaurant/database";
import type { AuthenticatedUser } from "../../../types/auth.js";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  updateOrderStatusSchema,
  type UpdateOrderStatusDTO,
} from "../schemas/update-order-status.schema.js";
import {
  OrderNotFoundError,
  toOrderDTO,
  type OrderDTO,
} from "./get-order.use-case.js";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.SERVED],
  [OrderStatus.SERVED]: [],
  [OrderStatus.CANCELLED]: [],
};

const ALL_TRANSITIONS = Object.entries(ORDER_TRANSITIONS).flatMap(
  ([from, toList]) => toList.map((to) => [from as OrderStatus, to] as const),
);

const ROLE_ALLOWED_TRANSITIONS: Record<
  UserRole,
  ReadonlyArray<readonly [OrderStatus, OrderStatus]>
> = {
  [UserRole.OWNER]: ALL_TRANSITIONS,
  [UserRole.MANAGER]: ALL_TRANSITIONS,
  [UserRole.KITCHEN]: [
    [OrderStatus.PENDING, OrderStatus.CONFIRMED],
    [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
    [OrderStatus.PREPARING, OrderStatus.READY],
  ],
  [UserRole.WAITER]: [[OrderStatus.READY, OrderStatus.SERVED]],
  [UserRole.CASHIER]: [],
};

export class InvalidStatusTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot change order status from ${from} to ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}

export class ForbiddenStatusTransitionError extends Error {
  constructor() {
    super("You do not have permission to perform this status change");
    this.name = "ForbiddenStatusTransitionError";
  }
}

export interface UpdateOrderStatusParams {
  orderId: string;
  user: AuthenticatedUser;
  input: UpdateOrderStatusDTO;
}

export class UpdateOrderStatusUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  private isTransitionAllowed(from: OrderStatus, to: OrderStatus): boolean {
    return ORDER_TRANSITIONS[from].includes(to);
  }

  private isUserAllowed(
    from: OrderStatus,
    to: OrderStatus,
    role: UserRole,
  ): boolean {
    return ROLE_ALLOWED_TRANSITIONS[role].some(
      ([allowedFrom, allowedTo]) => allowedFrom === from && allowedTo === to,
    );
  }

  async execute(params: UpdateOrderStatusParams): Promise<OrderDTO> {
    const data = updateOrderStatusSchema.parse(params.input);

    const order = await this.orderRepository.findById(params.orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    if (!this.isTransitionAllowed(order.status, data.status)) {
      throw new InvalidStatusTransitionError(order.status, data.status);
    }

    if (!this.isUserAllowed(order.status, data.status, params.user.role)) {
      throw new ForbiddenStatusTransitionError();
    }

    const updated = await this.orderRepository.updateStatus(
      order.id,
      data.status,
    );

    return toOrderDTO(updated);
  }
}
