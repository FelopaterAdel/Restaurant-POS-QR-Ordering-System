import type { NextFunction, Response } from "express";
import { sendPaginated, sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CompleteOrderUseCase } from "../use-cases/complete-order.use-case.js";
import { GetOrderUseCase } from "../use-cases/get-order.use-case.js";
import { ListOrdersUseCase } from "../use-cases/list-orders.use-case.js";
import { UpdateOrderStatusUseCase } from "../use-cases/update-order-status.use-case.js";
import type { ListOrdersDTO } from "../schemas/list-orders.schema.js";

const listOrdersUseCase = new ListOrdersUseCase();
const getOrderUseCase = new GetOrderUseCase();
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase();
const completeOrderUseCase = new CompleteOrderUseCase();

export async function listOrders(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { page, limit } = req.query as unknown as ListOrdersDTO;

  const result = await listOrdersUseCase.execute({ page, limit });
  sendPaginated(res, result.data, result.pagination);
}

export async function getOrder(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const order = await getOrderUseCase.execute(req.params.id);
  sendSuccess(res, order);
}

export async function updateOrderStatus(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const order = await updateOrderStatusUseCase.execute({
    orderId: req.params.id,
    user: req.user,
    input: req.body,
  });
  sendSuccess(res, order);
}

export async function completeOrder(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const order = await completeOrderUseCase.execute({
    orderId: req.params.id,
  });
  sendSuccess(res, order);
}
