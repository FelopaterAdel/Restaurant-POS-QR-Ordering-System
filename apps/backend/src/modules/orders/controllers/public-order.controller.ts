import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import { CreateOrderUseCase } from "../use-cases/create-order.use-case.js";
import { GetPublicOrderUseCase } from "../use-cases/get-public-order.use-case.js";

const createOrderUseCase = new CreateOrderUseCase();
const getPublicOrderUseCase = new GetPublicOrderUseCase();

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const order = await createOrderUseCase.execute(req.body);
  sendSuccess(res, order, 201);
}

export async function getPublicOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const order = await getPublicOrderUseCase.execute(req.params, req.query);
  sendSuccess(res, order);
}
