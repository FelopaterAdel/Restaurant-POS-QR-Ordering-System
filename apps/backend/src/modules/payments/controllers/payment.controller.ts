import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { OrderNotFoundError } from "../../orders/use-cases/get-order.use-case.js";
import {
  OrderNotPayableError,
  PayOrderUseCase,
  PaymentAlreadyExistsError,
} from "../use-cases/pay-order.use-case.js";

const payOrderUseCase = new PayOrderUseCase();

export async function payOrder(
  req: AuthenticatedRequest<{ orderId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const payment = await payOrderUseCase.execute({
      orderId: req.params.orderId,
      input: req.body,
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (
      error instanceof OrderNotPayableError ||
      error instanceof PaymentAlreadyExistsError
    ) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}
