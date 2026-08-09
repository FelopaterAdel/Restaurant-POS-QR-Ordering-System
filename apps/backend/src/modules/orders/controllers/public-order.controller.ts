import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import { CreateOrderUseCase } from "../use-cases/create-order.use-case.js";

const createOrderUseCase = new CreateOrderUseCase();

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const order = await createOrderUseCase.execute(req.body);
  sendSuccess(res, order, 201);
}
