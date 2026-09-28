import { OrderStatus, PaymentStatus } from "@restaurant/database";
import {
  BadRequestError,
  ConflictError,
} from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { AwardLoyaltyPointsUseCase } from "../../loyalty/use-cases/award-loyalty-points.use-case.js";
import {
  OrderNotFoundError,
  toOrderDTO,
  type OrderDTO,
} from "./get-order.use-case.js";

export class OrderNotPaidError extends BadRequestError {
  constructor() {
    super(AppErrorCode.ORDER_NOT_PAID, "Order must be paid before completion");
    this.name = "OrderNotPaidError";
  }
}

export class OrderCannotBeCompletedError extends ConflictError {
  constructor() {
    super(AppErrorCode.ORDER_CANNOT_BE_COMPLETED, "Order cannot be completed");
    this.name = "OrderCannotBeCompletedError";
  }
}

export class OrderAlreadyCompletedError extends ConflictError {
  constructor() {
    super(AppErrorCode.ORDER_ALREADY_COMPLETED, "Order is already completed");
    this.name = "OrderAlreadyCompletedError";
  }
}

export interface CompleteOrderParams {
  orderId: string;
}

export class CompleteOrderUseCase {
  private readonly orderRepository: OrderRepository;
  private readonly awardLoyalty: Pick<AwardLoyaltyPointsUseCase, "execute">;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    awardLoyalty: Pick<
      AwardLoyaltyPointsUseCase,
      "execute"
    > = new AwardLoyaltyPointsUseCase(),
  ) {
    this.orderRepository = orderRepository;
    this.awardLoyalty = awardLoyalty;
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

    // Best-effort: completion is already committed, so a loyalty failure
    // must never fail the cashier flow.
    if (completed.customerPhone) {
      try {
        await this.awardLoyalty.execute({ orderId: completed.id });
      } catch (error) {
        console.error(
          `Failed to award loyalty points for order ${completed.id}`,
          error,
        );
      }
    }

    return toOrderDTO(completed);
  }
}
