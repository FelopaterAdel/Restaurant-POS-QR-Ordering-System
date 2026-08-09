import type { NextFunction, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { PayOrderUseCase } from "../use-cases/pay-order.use-case.js";

const payOrderUseCase = new PayOrderUseCase();

export async function payOrder(
  req: AuthenticatedRequest<{ orderId: string }>,
  res: Response,
  next: NextFunction,
) {
  const payment = await payOrderUseCase.execute({
    orderId: req.params.orderId,
    input: req.body,
  });
  sendSuccess(res, payment, 201);
}
