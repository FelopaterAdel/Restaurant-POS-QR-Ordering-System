import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { GetOrderQueueUseCase } from "../use-cases/get-order-queue.use-case.js";
import type { GetOrderQueueDTO } from "../schemas/get-order-queue.schema.js";

const getOrderQueueUseCase = new GetOrderQueueUseCase();

export async function getOrderQueue(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { status, page, limit } = req.query as unknown as GetOrderQueueDTO;

    const result = await getOrderQueueUseCase.execute({ status, page, limit });

    res.status(200).json({
      success: true,
      message: "Order queue retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
