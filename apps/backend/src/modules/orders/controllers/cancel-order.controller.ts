import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import {
  OrderAlreadyCancelledError,
  OrderCannotBeCancelledError,
  PaidOrderCannotBeCancelledError,
  CancelOrderUseCase,
} from "../use-cases/cancel-order.use-case.js";
import { OrderNotFoundError } from "../use-cases/get-order.use-case.js";

const cancelOrderUseCase = new CancelOrderUseCase();

export async function cancelOrder(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await cancelOrderUseCase.execute({
      orderId: req.params.id,
      input: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (
      error instanceof OrderAlreadyCancelledError ||
      error instanceof OrderCannotBeCancelledError ||
      error instanceof PaidOrderCannotBeCancelledError
    ) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}
