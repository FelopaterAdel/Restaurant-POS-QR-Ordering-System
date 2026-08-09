import type { NextFunction, Response } from "express";
import { sendPaginated } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { GetOrderHistoryUseCase } from "../use-cases/get-order-history.use-case.js";
import type { OrderHistoryQueryDTO } from "../schemas/order-history-query.schema.js";

const getOrderHistoryUseCase = new GetOrderHistoryUseCase();

export async function getOrderHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { orderNumber, status, date, page, limit } =
    req.query as unknown as OrderHistoryQueryDTO;

  const result = await getOrderHistoryUseCase.execute({
    orderNumber,
    status,
    date,
    page,
    limit,
  });

  sendPaginated(res, result.data, result.pagination);
}
