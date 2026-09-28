import { OrderStatus, UserRole } from "@restaurant/database";
import {
  ConflictError,
  ForbiddenError,
} from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
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
import { createNotificationForRoles } from "../../notifications/services/notification.service.js";
import { DeductOrderStockUseCase } from "../../ingredients/use-cases/deduct-order-stock.use-case.js";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.SERVED],
  [OrderStatus.SERVED]: [],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

const ALL_TRANSITIONS = Object.entries(ORDER_TRANSITIONS).flatMap(
  ([from, toList]) => toList.map((to) => [from as OrderStatus, to] as const),
);

export const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = (
  Object.keys(ORDER_TRANSITIONS) as OrderStatus[]
).filter((status) =>
  ORDER_TRANSITIONS[status].includes(OrderStatus.CANCELLED),
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

export class InvalidStatusTransitionError extends ConflictError {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(
      AppErrorCode.ORDER_INVALID_STATUS,
      `Cannot change order status from ${from} to ${to}`,
    );
    this.name = "InvalidStatusTransitionError";
  }
}

export class ForbiddenStatusTransitionError extends ForbiddenError {
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
  private readonly stockDeduction: Pick<
    DeductOrderStockUseCase,
    "deductForOrder"
  >;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    stockDeduction: Pick<
      DeductOrderStockUseCase,
      "deductForOrder"
    > = new DeductOrderStockUseCase(),
  ) {
    this.orderRepository = orderRepository;
    this.stockDeduction = stockDeduction;
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

    if (data.status === OrderStatus.PREPARING) {
      // Best-effort: the status change is already committed, so an
      // inventory failure must never break the kitchen flow.
      try {
        await this.stockDeduction.deductForOrder(order.id);
      } catch (error) {
        console.error(
          `Failed to deduct recipe stock for order ${order.id}`,
          error,
        );
      }
    }

    if (data.status === OrderStatus.READY) {
      await createNotificationForRoles("ORDER_READY", {
        title: "Order Ready",
        message: `Order #${updated.orderNumber}`,
        entityType: "ORDER",
        entityId: updated.id,
      });
    }

    return toOrderDTO(updated);
  }
}
