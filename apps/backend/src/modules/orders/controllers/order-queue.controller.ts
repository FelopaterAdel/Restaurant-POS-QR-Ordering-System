import type { NextFunction, Response } from "express";
import { sendPaginated } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { GetOrderQueueUseCase } from "../use-cases/get-order-queue.use-case.js";
import type { GetOrderQueueDTO } from "../schemas/get-order-queue.schema.js";

const getOrderQueueUseCase = new GetOrderQueueUseCase();

export async function getOrderQueue(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { status, page, limit } = req.query as unknown as GetOrderQueueDTO;

  const result = await getOrderQueueUseCase.execute({ status, page, limit });
  sendPaginated(res, result.data, result.pagination);
}
