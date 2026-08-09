import type { NextFunction, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CancelOrderUseCase } from "../use-cases/cancel-order.use-case.js";

const cancelOrderUseCase = new CancelOrderUseCase();

export async function cancelOrder(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const order = await cancelOrderUseCase.execute({
    orderId: req.params.id,
    input: req.body,
  });
  sendSuccess(res, order);
}
