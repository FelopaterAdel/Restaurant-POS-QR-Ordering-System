import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { GetOrderHistoryUseCase } from "../use-cases/get-order-history.use-case.js";
import type { OrderHistoryQueryDTO } from "../schemas/order-history-query.schema.js";

const getOrderHistoryUseCase = new GetOrderHistoryUseCase();

export async function getOrderHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { orderNumber, status, date, page, limit } =
      req.query as unknown as OrderHistoryQueryDTO;

    const result = await getOrderHistoryUseCase.execute({
      orderNumber,
      status,
      date,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Order history retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
