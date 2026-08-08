import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import {
  OrderAlreadyCompletedError,
  OrderCannotBeCompletedError,
  CompleteOrderUseCase,
  OrderNotPaidError,
} from "../use-cases/complete-order.use-case.js";
import {
  OrderNotFoundError,
  GetOrderUseCase,
} from "../use-cases/get-order.use-case.js";
import { ListOrdersUseCase } from "../use-cases/list-orders.use-case.js";
import {
  ForbiddenStatusTransitionError,
  InvalidStatusTransitionError,
  UpdateOrderStatusUseCase,
} from "../use-cases/update-order-status.use-case.js";

const listOrdersUseCase = new ListOrdersUseCase();
const getOrderUseCase = new GetOrderUseCase();
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase();
const completeOrderUseCase = new CompleteOrderUseCase();

export async function listOrders(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const orders = await listOrdersUseCase.execute();

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrder(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await getOrderUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateOrderStatus(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await updateOrderStatusUseCase.execute({
      orderId: req.params.id,
      user: req.user,
      input: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof InvalidStatusTransitionError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error instanceof ForbiddenStatusTransitionError) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function completeOrder(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await completeOrderUseCase.execute({
      orderId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "Order completed successfully",
      data: order,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof OrderNotPaidError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (
      error instanceof OrderCannotBeCompletedError ||
      error instanceof OrderAlreadyCompletedError
    ) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}
